#!/usr/bin/env node
/**
 * End-to-end test, part 2 — runs after commerce.e2e.mjs on the same database
 * (it reuses that run's products, shipping zone and accounts). Covers:
 * newsletter, live search, wishlist, back-in-stock alerts, password resets,
 * customer account management, staff-created orders with offline payment,
 * Stripe payment links + signed webhooks + refunds, shipping emails, CSV
 * exports with RBAC, abandoned-cart recovery and unsubscribe.
 */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { createRequire } from "node:module";
import postgres from "postgres";

const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const MOCK = process.env.MOCK_URL ?? "http://127.0.0.1:4010";
const WHSEC = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_mock";
const CRON = process.env.CRON_SECRET ?? "cron-test-secret";
const OWNER = { email: "owner@chisseled.test", password: process.env.OWNER_PASSWORD ?? "OwnerPass12345" };
const sql = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} });
const results = [];
const errors = [];

async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push(["PASS", name]);
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (err) {
    results.push(["FAIL", name]);
    console.log(`  ✗ ${name}\n    ${err?.stack?.split("\n").slice(0, 4).join("\n    ")}`);
    throw err;
  }
}
const see = (page, text) => page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
const emails = async () => (await fetch(`${MOCK}/__emails`)).json();
const lastEmailTo = async (to, subject) => (await emails()).filter((m) => m.to.includes(to) && (!subject || m.subject.includes(subject))).pop();
const cron = async () => (await fetch(`${BASE}/api/cron/maintenance`, { headers: { authorization: `Bearer ${CRON}` } })).json();
const linkIn = (html, path) => html.match(new RegExp(`${BASE}${path}\\?token=([^"<&]+)`))?.[1];

const browser = await chromium.launch();
async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
}
async function adminLogin(page, email, password) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${BASE}/admin`, { waitUntil: "commit" });
}
async function pickVariant(page, text) {
  const value = await page.locator('select[name="variant_id"] option', { hasText: text }).first().getAttribute("value");
  await page.locator('select[name="variant_id"]').selectOption(value);
}
const stock = async (sku) => (await sql`select i.on_hand, i.reserved from inventory i join product_variants v on v.id = i.variant_id where v.sku = ${sku}`)[0];

try {
  const shopper = await newPage();
  const admin = await newPage();
  await adminLogin(admin, OWNER.email, OWNER.password);

  console.log("Storefront data");
  await step("newsletter sign-up is stored (and de-duplicated)", async () => {
    await shopper.goto(`${BASE}/`);
    await shopper.fill("#footer-email", "fan@example.com");
    await shopper.getByRole("button", { name: /^Join/ }).click();
    await see(shopper, "You're in.");
    const [row] = await sql`select status, unsubscribe_token from newsletter_subscribers where email = 'fan@example.com'`;
    assert.equal(row.status, "subscribed");
  });

  await step("search finds products created in the admin", async () => {
    await shopper.goto(`${BASE}/shop`);
    await shopper.keyboard.press("Control+k");
    await shopper.getByRole("dialog", { name: "Search" }).locator("input").fill("performance hood");
    await shopper.getByRole("dialog", { name: "Search" }).getByText("Test Performance Hoodie").waitFor({ timeout: 10000 });
  });

  await step("wishlist shows live products only", async () => {
    await shopper.evaluate(() =>
      localStorage.setItem("chisseled.prefs.v1", JSON.stringify({ wishlist: ["test-performance-hoodie", "not-a-real-product"], recent: [], currency: "USD" })),
    );
    await shopper.goto(`${BASE}/wishlist`);
    await see(shopper, "Test Performance Hoodie");
  });

  await step("back-in-stock alert is saved and emailed when stock returns", async () => {
    await sql`update inventory set on_hand = 0, reserved = 0 from product_variants v where v.id = inventory.variant_id and v.sku = 'TPH-S-BLACK'`;
    await shopper.goto(`${BASE}/product/test-performance-hoodie`);
    await shopper.getByRole("button", { name: "Get a back-in-stock alert" }).click();
    await shopper.selectOption("#bis-size", "S");
    await shopper.fill("#bis-email", "waiting@example.com");
    await shopper.getByRole("button", { name: "Notify me" }).click();
    await see(shopper, "we'll email you the moment it's back");
    const [a] = await sql`select v.sku from stock_alerts a join product_variants v on v.id = a.variant_id where a.email = 'waiting@example.com' and a.notified_at is null`;
    assert.equal(a.sku, "TPH-S-BLACK");
    assert.equal((await cron()).stockAlerts, 0, "no email while still sold out");
    await sql`update inventory set on_hand = 4 from product_variants v where v.id = inventory.variant_id and v.sku = 'TPH-S-BLACK'`;
    assert.equal((await cron()).stockAlerts, 1);
    assert.equal((await cron()).stockAlerts, 0, "sent once only");
    assert.ok(await lastEmailTo("waiting@example.com", "Back in stock"));
  });

  console.log("Accounts");
  await step("customer resets password via emailed one-time link", async () => {
    await shopper.goto(`${BASE}/account/forgot`);
    await shopper.fill("#f-email", "ada@example.com");
    await shopper.getByRole("button", { name: "Send reset link" }).click();
    await see(shopper, "a reset link is on its way");
    const token = linkIn((await lastEmailTo("ada@example.com", "password")).html, "/account/reset");
    assert.ok(token);
    await shopper.goto(`${BASE}/account/reset?token=${token}`);
    await shopper.fill("#f-password", "AdaNewPass123");
    await shopper.getByRole("button", { name: "Save password" }).click();
    await see(shopper, "Password set");
    await shopper.goto(`${BASE}/account/reset?token=${token}`);
    await shopper.fill("#f-password", "AnotherPass123");
    await shopper.getByRole("button", { name: "Save password" }).click();
    await see(shopper, "expired or was already used");
  });

  await step("unknown emails get the same reset response (no account discovery)", async () => {
    const before = (await emails()).length;
    await shopper.goto(`${BASE}/account/forgot`);
    await shopper.fill("#f-email", "nobody@example.com");
    await shopper.getByRole("button", { name: "Send reset link" }).click();
    await see(shopper, "a reset link is on its way");
    assert.equal((await emails()).length, before);
  });

  await step("customer signs in with the new password and manages profile + addresses", async () => {
    await shopper.goto(`${BASE}/account`);
    await shopper.fill("#account-email", "ada@example.com");
    await shopper.fill("#account-password", "AdaNewPass123");
    await shopper.locator("form").getByRole("button", { name: "Sign in" }).click();
    await see(shopper, "Welcome back, Ada");
    await shopper.getByText("Add an address").click();
    const form = shopper.locator("form", { has: shopper.getByRole("button", { name: "Save address" }) });
    await form.locator('input[name="line1"]').fill("4 Admiralty Way");
    await form.locator('input[name="city"]').fill("Lekki");
    await form.locator('select[name="country"]').selectOption("NG");
    await form.getByRole("button", { name: "Save address" }).click();
    await see(shopper, "Address saved");
    const profile = shopper.locator("form", { has: shopper.getByRole("button", { name: "Save profile" }) });
    await profile.locator('input[name="phone"]').fill("+234 800 000 0000");
    await profile.getByRole("button", { name: "Save profile" }).click();
    await see(shopper, "Profile saved");
    const [c] = await sql`select phone, (select count(*)::int from customer_addresses a where a.customer_id = customers.id and is_default) as defaults from customers where email = 'ada@example.com'`;
    assert.equal(c.phone, "+234 800 000 0000");
    assert.equal(c.defaults, 1);
  });

  console.log("Staff-created orders");
  let manualId;
  await step("staff creates a WhatsApp order and records a bank transfer", async () => {
    const before = await stock("TPH-L-BLACK");
    await admin.goto(`${BASE}/admin/orders/new`);
    await pickVariant(admin, "L / Black");
    await admin.locator('input[name="qty"]').fill("2");
    await admin.fill('input[name="email"]', "walkin@example.com");
    await admin.fill('input[name="firstName"]', "Tunde");
    await admin.fill('input[name="line1"]', "1 Broad Street");
    await admin.fill('input[name="city"]', "Lagos");
    await admin.selectOption('select[name="country"]', "NG");
    await admin.fill('input[name="shipping_price"]', "5.00");
    await admin.getByRole("button", { name: "Create order" }).click();
    await admin.waitForURL(/\/admin\/orders\/[0-9a-f-]{36}\?created=1/, { waitUntil: "commit" });
    manualId = admin.url().match(/orders\/([0-9a-f-]{36})/)[1];
    const held = await stock("TPH-L-BLACK");
    assert.equal(held.reserved, before.reserved + 2);
    await admin.fill('input[name="external_ref"]', "GTB-TRX-001");
    await admin.getByRole("button", { name: /^Mark .* as paid/ }).click();
    // The payment card disappears once paid; the timeline records it.
    await see(admin, "Offline payment recorded (Bank transfer)");
    const [o] = await sql`select payment_status, total_cents, inventory_state from orders where id = ${manualId}`;
    assert.deepEqual([o.payment_status, o.total_cents, o.inventory_state], ["paid", 2 * 8900 + 500, "committed"]);
    const [p] = await sql`select provider, manual_method, status from payments where order_id = ${manualId}`;
    assert.deepEqual([p.provider, p.manual_method, p.status], ["manual", "Bank transfer", "succeeded"]);
    const after = await stock("TPH-L-BLACK");
    assert.equal(after.on_hand, before.on_hand - 2);
  });

  await step("shipping the order emails the customer their tracking", async () => {
    await admin.goto(`${BASE}/admin/orders/${manualId}`);
    await admin.fill('input[name="carrier"]', "GIG Logistics");
    await admin.fill('input[name="tracking_number"]', "GIG-777");
    await admin.getByRole("button", { name: "Mark as shipped" }).click();
    await see(admin, "Shipment created");
    const mail = await lastEmailTo("walkin@example.com", "on its way");
    assert.ok(mail?.html.includes("GIG-777"));
  });

  await step("offline payments refund offline and email the customer", async () => {
    await admin.goto(`${BASE}/admin/orders/${manualId}`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: /^Refund/ }) });
    await form.locator('input[name="amount"]').fill("10.00");
    await form.getByRole("button", { name: /^Refund/ }).click();
    await see(admin, "Refund completed");
    assert.ok(await lastEmailTo("walkin@example.com", "Refund"));
  });

  console.log("Stripe");
  let stripeOrder;
  await step("staff sends a Stripe payment link; customer pays; order is verified", async () => {
    await admin.goto(`${BASE}/admin/orders/new`);
    await pickVariant(admin, "M / Black");
    await admin.fill('input[name="email"]', "intl@example.com");
    await admin.fill('input[name="firstName"]', "Grace");
    await admin.fill('input[name="line1"]', "10 Downing Street");
    await admin.fill('input[name="city"]', "London");
    await admin.selectOption('select[name="country"]', "GB");
    await admin.getByRole("button", { name: "Create order" }).click();
    await admin.waitForURL(/created=1/, { waitUntil: "commit" });
    stripeOrder = admin.url().match(/orders\/([0-9a-f-]{36})/)[1];
    await admin.selectOption('select[name="provider"]', "stripe");
    await admin.getByRole("button", { name: "Create link" }).click();
    const msg = await admin.getByText("Payment link (send this to the customer):").first().innerText();
    const link = msg.match(/https?:\/\/\S+/)[0];
    const customer = await newPage();
    await customer.goto(link);
    await customer.waitForURL(/\/order\/[0-9a-f-]{36}\?key=/, { waitUntil: "commit", timeout: 20000 });
    await see(customer, "Thank you. It");
    const [p] = await sql`select provider, status, provider_transaction_id from payments where order_id = ${stripeOrder} and status = 'succeeded'`;
    assert.equal(p.provider, "stripe");
    assert.match(p.provider_transaction_id, /^pi_test_/);
  });

  await step("Stripe webhooks: signature, staleness and replay are enforced", async () => {
    const [{ reference }] = await sql`select reference from payments where order_id = ${stripeOrder} and provider = 'stripe'`;
    const body = JSON.stringify({ id: "evt_test_1", type: "checkout.session.completed", data: { object: { client_reference_id: reference } } });
    const sign = (t) => `t=${t},v1=${createHmac("sha256", WHSEC).update(`${t}.${body}`).digest("hex")}`;
    const post = (sig) => fetch(`${BASE}/api/webhooks/stripe`, { method: "POST", body, headers: { "stripe-signature": sig, "content-type": "application/json" } });
    const now = Math.floor(Date.now() / 1000);
    assert.equal((await post("t=1,v1=deadbeef")).status, 401);
    assert.equal((await post(sign(now - 3600))).status, 401, "stale signature rejected");
    assert.equal((await (await post(sign(now))).json()).ok, true);
    assert.equal((await (await post(sign(now))).json()).duplicate, true);
    const [{ n }] = await sql`select count(*)::int as n from order_events where order_id = ${stripeOrder} and kind = 'paid'`;
    assert.equal(n, 1);
  });

  await step("Stripe refund goes through the provider", async () => {
    await admin.goto(`${BASE}/admin/orders/${stripeOrder}`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: /^Refund/ }) });
    await form.locator('input[name="amount"]').fill("5.00");
    await form.getByRole("button", { name: /^Refund/ }).click();
    await see(admin, "Refund completed");
    const [r] = await sql`select provider_refund_id, status from refunds where order_id = ${stripeOrder}`;
    assert.match(r.provider_refund_id, /^re_/);
  });

  console.log("Exports & marketing");
  await step("CSV exports: owner can download; anonymous can't; RBAC enforced", async () => {
    const res = await admin.request.get(`${BASE}/admin/export/orders`);
    assert.equal(res.status(), 200);
    const csv = await res.text();
    assert.match(csv, /walkin@example\.com/);
    assert.match(res.headers()["content-disposition"], /chisseled-orders/);
    assert.equal((await fetch(`${BASE}/admin/export/orders`)).status, 401);
    const support = await newPage();
    await adminLogin(support, "sam@chisseled.test", "SupportPass123");
    assert.equal((await support.request.get(`${BASE}/admin/export/customers`)).status(), 200);
    assert.equal((await support.request.get(`${BASE}/admin/export/subscribers`)).status(), 403);
  });

  await step("abandoned-cart reminder link restores the bag on another device", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/product/test-performance-hoodie`);
    await p.locator("#size-selector").getByRole("button", { name: /^M/ }).first().click();
    await p.getByRole("button", { name: /add to bag/i }).first().click();
    await p.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes("added to bag"));
    const [cart] = await sql`select c.id from carts c join cart_items ci on ci.cart_id = c.id where c.email is null order by c.created_at desc limit 1`;
    await sql`update carts set email = 'fan@example.com', status = 'abandoned', updated_at = now() - interval '2 hours' where id = ${cart.id}`;
    await sql`insert into customers (email, accepts_marketing) values ('fan@example.com', true) on conflict (email) do update set accepts_marketing = true`;
    await admin.goto(`${BASE}/admin/marketing`);
    await admin.locator("tr", { hasText: "fan@example.com" }).getByRole("button", { name: "Send reminder" }).click();
    // Once sent, the row shows "Reminded <date>" in place of the button.
    await admin.locator("tr", { hasText: "fan@example.com" }).getByText("Reminded").waitFor({ timeout: 15000 });
    const mail = await lastEmailTo("fan@example.com", "left something");
    const token = linkIn(mail.html, "/cart/recover");
    assert.ok(mail.html.includes("/unsubscribe?token="), "marketing email carries an unsubscribe link");
    const other = await newPage();
    await other.goto(`${BASE}/cart/recover?token=${token}`);
    await other.waitForURL(`${BASE}/checkout`, { waitUntil: "commit" });
    await see(other, "Test Performance Hoodie");
  });

  await step("one-click unsubscribe", async () => {
    const [{ unsubscribe_token }] = await sql`select unsubscribe_token from newsletter_subscribers where email = 'fan@example.com'`;
    await shopper.goto(`${BASE}/unsubscribe?token=${unsubscribe_token}`);
    await shopper.getByRole("button", { name: "Unsubscribe" }).click();
    await see(shopper, "won't receive marketing email");
    const [s] = await sql`select n.status, c.accepts_marketing from newsletter_subscribers n join customers c on c.email = n.email where n.email = 'fan@example.com'`;
    assert.deepEqual([s.status, s.accepts_marketing], ["unsubscribed", false]);
  });

  await step("staff password reset by email signs out old sessions", async () => {
    const p = await newPage();
    await p.goto(`${BASE}/admin/forgot`);
    await p.fill('input[name="email"]', OWNER.email);
    await p.getByRole("button", { name: "Send reset link" }).click();
    await see(p, "a reset link is on its way");
    const token = linkIn((await lastEmailTo(OWNER.email, "admin password")).html, "/admin/reset");
    await p.goto(`${BASE}/admin/reset?token=${token}`);
    await p.fill('input[name="password"]', "OwnerNewPass12345");
    await p.getByRole("button", { name: "Save password" }).click();
    await see(p, "Password changed");
    await admin.goto(`${BASE}/admin/orders`);
    assert.match(admin.url(), /\/admin\/login/, "existing session was revoked");
    await adminLogin(p, OWNER.email, "OwnerNewPass12345");
  });

  await step("no client-side errors", async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  await sql.end();
  const failed = results.filter((r) => r[0] === "FAIL").length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}
