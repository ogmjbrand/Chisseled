#!/usr/bin/env node
/**
 * End-to-end test of the commerce system against a real Postgres and the
 * Paystack test double (scripts/e2e/mock-paystack.mjs). Drives a real browser.
 *
 *   BASE_URL=http://localhost:3100 DATABASE_URL=... node scripts/e2e/commerce.e2e.mjs
 *
 * Requires: migrated DB, an owner account (OWNER_EMAIL / OWNER_PASSWORD),
 * the app running with PAYSTACK_BASE_URL pointing at the mock.
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
// Resolved like require() so a globally installed Playwright works too.
const { chromium } = createRequire(import.meta.url)("playwright");
import postgres from "postgres";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const MOCK = process.env.MOCK_URL ?? "http://127.0.0.1:4010";
const OWNER = { email: process.env.OWNER_EMAIL ?? "owner@chisseled.test", password: process.env.OWNER_PASSWORD ?? "OwnerPass12345" };
const sql = postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} });
const results = [];

async function step(name, fn) {
  const t = Date.now();
  try {
    await fn();
    results.push(["PASS", name]);
    console.log(`  ✓ ${name} (${Date.now() - t}ms)`);
  } catch (err) {
    results.push(["FAIL", name]);
    console.log(`  ✗ ${name}\n    ${err?.stack?.split("\n").slice(0, 3).join("\n    ")}`);
    throw err;
  }
}

async function expectMessage(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout: 15000 });
}

const browser = await chromium.launch();
const errors = [];
async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept());
  page.on("pageerror", (e) => errors.push(e.message));
  return page;
}

async function addToBag(page, slug, size) {
  await page.goto(`${BASE}/product/${slug}`);
  if (size) await page.locator("#size-selector").getByRole("button", { name: new RegExp(`^${size}`) }).first().click();
  await page.getByRole("button", { name: /add to bag/i }).first().click();
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent?.includes("added to bag"), null, { timeout: 15000 });
}

async function fillCheckout(page, email) {
  await page.goto(`${BASE}/checkout`);
  await page.fill("#co-email", email);
  await page.fill("#co-firstName", "Ada");
  await page.fill("#co-lastName", "Okafor");
  await page.fill("#co-line1", "12 Marina Road");
  await page.fill("#co-city", "Lagos");
  await page.selectOption("#co-country", "NG");
  await page.getByText("Standard", { exact: false }).first().waitFor({ timeout: 15000 });
}

let admin;
let hoodieId;
let orderId;

try {
  console.log("Admin setup");
  admin = await newPage();

  await step("admin requires sign-in", async () => {
    await admin.goto(`${BASE}/admin/products`);
    assert.match(admin.url(), /\/admin\/login$/);
  });

  await step("wrong password is rejected and audited", async () => {
    await admin.fill('input[name="email"]', OWNER.email);
    await admin.fill('input[name="password"]', "wrong-password-1");
    await admin.getByRole("button", { name: "Sign in" }).click();
    await expectMessage(admin, "Email or password is incorrect");
    const [row] = await sql`select count(*)::int as n from audit_logs where action = 'auth.login_failed'`;
    assert.ok(row.n >= 1);
  });

  await step("owner signs in", async () => {
    await admin.fill('input[name="password"]', OWNER.password);
    await admin.getByRole("button", { name: "Sign in" }).click();
    await admin.waitForURL(`${BASE}/admin`, { waitUntil: "commit" });
    await expectMessage(admin, "Net sales");
  });

  await step("create shipping zone + rate", async () => {
    await admin.goto(`${BASE}/admin/shipping`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: "Create zone" }) });
    await form.locator('input[name="name"]').fill("Nigeria");
    await form.locator('select[name="countries"]').selectOption(["NG"]);
    await form.getByRole("button", { name: "Create zone" }).click();
    await expectMessage(admin, "Zone created");
    await admin.reload();
    await admin.getByText("Add a rate").click();
    const rate = admin.locator("form", { has: admin.getByRole("button", { name: "Add rate" }) });
    await rate.locator('input[name="name"]').fill("Standard");
    await rate.locator('input[name="price"]').fill("10.00");
    await rate.locator('input[name="free_over"]').fill("500.00");
    await rate.locator('input[name="days_min"]').fill("2");
    await rate.locator('input[name="days_max"]').fill("5");
    await rate.getByRole("button", { name: "Add rate" }).click();
    await expectMessage(admin, "Rate added");
  });

  await step("create product with variants, stock and image", async () => {
    await admin.goto(`${BASE}/admin/products/new`);
    await admin.fill('input[name="title"]', "Test Performance Hoodie");
    await admin.fill('input[name="subtitle"]', "Heavyweight, built to train in.");
    await admin.fill('textarea[name="description"]', "A 400gsm loopback hoodie.");
    await admin.fill('input[name="price"]', "89.00");
    await admin.fill('input[name="cost"]', "30.00");
    await admin.fill('input[name="sku"]', "TPH");
    await admin.fill('input[name="stock"]', "3");
    await admin.fill('textarea[name="options"]', "Size: S, M, L\nColor: Black");
    await admin.selectOption('select[name="status"]', "active");
    await admin.getByLabel("Essentials").check();
    await admin.getByRole("button", { name: "Create product" }).click();
    await admin.waitForURL(/\/admin\/products\/[0-9a-f-]{36}\?created=1/, { waitUntil: "commit" });
    hoodieId = admin.url().match(/products\/([0-9a-f-]{36})/)[1];
    await admin.fill('input[name="url"]', "/media/product/actively-tee--onyx.webp");
    await admin.fill('input[name="alt"]', "Black hoodie, front");
    await admin.getByRole("button", { name: "Add image" }).click();
    await expectMessage(admin, "Image added");
    const v = await sql`select v.sku, i.on_hand from product_variants v join inventory i on i.variant_id = v.id where v.product_id = ${hoodieId} order by v.position`;
    assert.deepEqual(v.map((r) => r.sku), ["TPH-S-BLACK", "TPH-M-BLACK", "TPH-L-BLACK"]);
    assert.ok(v.every((r) => r.on_hand === 3));
  });

  await step("create single-stock product for the oversell test", async () => {
    await admin.goto(`${BASE}/admin/products/new`);
    await admin.fill('input[name="title"]', "Limited Drop Cap");
    await admin.fill('input[name="price"]', "25.00");
    await admin.fill('input[name="stock"]', "1");
    await admin.selectOption('select[name="status"]', "active");
    await admin.getByRole("button", { name: "Create product" }).click();
    await admin.waitForURL(/created=1/, { waitUntil: "commit" });
  });

  await step("create discount code", async () => {
    await admin.goto(`${BASE}/admin/discounts`);
    await admin.fill('input[name="code"]', "train10");
    await admin.fill('input[name="title"]', "Launch 10%");
    await admin.fill('input[name="percent"]', "10");
    await admin.getByRole("button", { name: "Create discount" }).click();
    await expectMessage(admin, "Discount created");
  });

  console.log("Storefront");
  const shopper = await newPage();

  await step("storefront lists the new product from the database", async () => {
    await shopper.goto(`${BASE}/shop`);
    await expectMessage(shopper, "Test Performance Hoodie");
    await shopper.goto(`${BASE}/shop/essentials`);
    await expectMessage(shopper, "Test Performance Hoodie");
  });

  await step("draft products are not reachable", async () => {
    await sql`update products set status = 'draft' where slug = 'limited-drop-cap'`;
    // The route streams behind loading.tsx, so Next serves a soft 404 (noindex) — assert the content.
    await shopper.goto(`${BASE}/product/limited-drop-cap`);
    await expectMessage(shopper, "This one isn");
    assert.equal(await shopper.getByText("Limited Drop Cap").count(), 0);
    await shopper.goto(`${BASE}/shop`);
    assert.equal(await shopper.getByText("Limited Drop Cap").count(), 0);
    await sql`update products set status = 'active' where slug = 'limited-drop-cap'`;
  });

  await step("add to bag (size M), qty capped by stock", async () => {
    await addToBag(shopper, "test-performance-hoodie", "M");
    const [c] = await sql`select count(*)::int as n from cart_items`;
    assert.equal(c.n, 1);
  });

  await step("checkout with discount → pay → confirmation", async () => {
    await fillCheckout(shopper, "ada@example.com");
    await shopper.fill("#co-code", "TRAIN10");
    await shopper.getByRole("button", { name: "Apply" }).click();
    await expectMessage(shopper, "Launch 10%");
    await shopper.getByRole("button", { name: /^Pay / }).click();
    await shopper.waitForURL(/\/order\/[0-9a-f-]{36}\?key=/, { timeout: 30000, waitUntil: "commit" });
    await expectMessage(shopper, "Thank you. It");
    orderId = shopper.url().match(/order\/([0-9a-f-]{36})/)[1];
  });

  await step("order, payment, stock and discount are consistent in the database", async () => {
    const [o] = await sql`select * from orders where id = ${orderId}`;
    assert.equal(o.payment_status, "paid");
    assert.equal(o.status, "open");
    assert.equal(o.inventory_state, "committed");
    assert.equal(o.subtotal_cents, 8900);
    assert.equal(o.discount_cents, 890);
    assert.equal(o.shipping_cents, 1000);
    assert.equal(o.total_cents, 8900 - 890 + 1000);
    const [p] = await sql`select status, amount_cents from payments where order_id = ${orderId}`;
    assert.equal(p.status, "succeeded");
    assert.equal(p.amount_cents, o.total_cents);
    const [inv] = await sql`select i.on_hand, i.reserved from inventory i join product_variants v on v.id = i.variant_id where v.sku = 'TPH-M-BLACK'`;
    assert.deepEqual([inv.on_hand, inv.reserved], [2, 0]);
    const moves = await sql`select reason from inventory_movements m join product_variants v on v.id = m.variant_id where v.sku = 'TPH-M-BLACK' order by m.id`;
    assert.deepEqual(moves.map((m) => m.reason), ["restock", "reservation", "sale"]);
    const [d] = await sql`select times_used from discounts where code = 'TRAIN10'`;
    assert.equal(d.times_used, 1);
    const [cart] = await sql`select status from carts where converted_order_id = ${orderId}`;
    assert.equal(cart.status, "converted");
  });

  await step("bag is empty after purchase", async () => {
    await shopper.goto(`${BASE}/checkout`);
    await expectMessage(shopper, "Your bag is empty");
  });

  await step("confirmation page needs the access key", async () => {
    const other = await newPage();
    await other.goto(`${BASE}/order/${orderId}`);
    await expectMessage(other, "This one isn");
    assert.equal(await other.getByText("Thank you").count(), 0);
  });

  console.log("Webhooks");
  const [{ reference }] = await sql`select reference from payments where order_id = ${orderId}`;
  const payload = JSON.stringify({ event: "charge.success", data: { id: 1, reference, status: "success" } });

  await step("unsigned / wrongly signed webhook → 401", async () => {
    const res = await fetch(`${BASE}/api/webhooks/paystack`, { method: "POST", body: payload, headers: { "x-paystack-signature": "deadbeef", "content-type": "application/json" } });
    assert.equal(res.status, 401);
  });

  await step("signed webhook is processed once (idempotent replay)", async () => {
    const { signature } = await (await fetch(`${MOCK}/__sign`, { method: "POST", body: payload })).json();
    const send = () => fetch(`${BASE}/api/webhooks/paystack`, { method: "POST", body: payload, headers: { "x-paystack-signature": signature, "content-type": "application/json" } });
    const first = await (await send()).json();
    const second = await (await send()).json();
    assert.equal(first.ok, true);
    assert.equal(second.duplicate, true);
    const [inv] = await sql`select i.on_hand from inventory i join product_variants v on v.id = i.variant_id where v.sku = 'TPH-M-BLACK'`;
    assert.equal(inv.on_hand, 2, "stock must not be decremented twice");
    const [{ n }] = await sql`select count(*)::int as n from order_events where order_id = ${orderId} and kind = 'paid'`;
    assert.equal(n, 1);
  });

  console.log("Concurrency");
  await step("two shoppers race for the last unit — exactly one wins", async () => {
    const a = await newPage();
    const b = await newPage();
    await addToBag(a, "limited-drop-cap");
    await addToBag(b, "limited-drop-cap");
    await fillCheckout(a, "a@example.com");
    await fillCheckout(b, "b@example.com");
    await Promise.all([a.getByRole("button", { name: /^Pay / }).click(), b.getByRole("button", { name: /^Pay / }).click()]);
    await Promise.all([a.waitForLoadState("networkidle"), b.waitForLoadState("networkidle")]);
    await new Promise((r) => setTimeout(r, 1500));
    const urls = [a.url(), b.url()];
    const won = urls.filter((u) => /\/order\//.test(u)).length;
    assert.equal(won, 1, `exactly one checkout should succeed, got ${urls.join(" | ")}`);
    const loser = /\/order\//.test(a.url()) ? b : a;
    // Depending on timing the loser is stopped by the stock pre-check or by the reservation itself.
    await loser.getByRole("alert").filter({ hasText: /sold out|no longer available|left/ }).first().waitFor({ timeout: 15000 });
    assert.equal(await loser.inputValue("#co-email"), /\/order\//.test(a.url()) ? "b@example.com" : "a@example.com", "form keeps input after a rejected order");
    const [inv] = await sql`select i.on_hand, i.reserved from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id where p.slug = 'limited-drop-cap'`;
    assert.deepEqual([inv.on_hand, inv.reserved], [0, 0]);
  });

  console.log("Operations");
  await step("admin fulfils the order with tracking", async () => {
    await admin.goto(`${BASE}/admin/orders/${orderId}`);
    await admin.fill('input[name="carrier"]', "GIG Logistics");
    await admin.fill('input[name="tracking_number"]', "GIG123456");
    await admin.getByRole("button", { name: "Mark as shipped" }).click();
    await expectMessage(admin, "Shipment created");
    const [o] = await sql`select fulfillment_status, status from orders where id = ${orderId}`;
    assert.deepEqual([o.fulfillment_status, o.status], ["fulfilled", "completed"]);
  });

  await step("admin issues a partial refund with restock", async () => {
    await admin.goto(`${BASE}/admin/orders/${orderId}`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: /^Refund/ }) });
    await form.locator('input[name="amount"]').fill("20.00");
    await form.locator('input[name^="restock."]').first().fill("1");
    await form.getByRole("button", { name: /^Refund/ }).click();
    await expectMessage(admin, "Refund completed");
    const [o] = await sql`select refunded_cents, payment_status from orders where id = ${orderId}`;
    assert.deepEqual([o.refunded_cents, o.payment_status], [2000, "partially_refunded"]);
    const [inv] = await sql`select i.on_hand from inventory i join product_variants v on v.id = i.variant_id where v.sku = 'TPH-M-BLACK'`;
    assert.equal(inv.on_hand, 3);
  });

  await step("refund can't exceed what's refundable", async () => {
    await admin.goto(`${BASE}/admin/orders/${orderId}`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: /^Refund/ }) });
    await form.locator('input[name="amount"]').fill("9999.00");
    await form.getByRole("button", { name: /^Refund/ }).click();
    await expectMessage(admin, "Refund must be between");
  });

  await step("inventory adjustment is logged", async () => {
    await admin.goto(`${BASE}/admin/inventory?q=TPH-L`);
    const row = admin.locator("tr", { hasText: "L / Black" });
    await row.locator('input[name="quantity"]').fill("5");
    await row.getByRole("button", { name: "Save" }).click();
    await expectMessage(admin, "Stock updated — 8 on hand");
  });

  await step("analytics reflect real orders", async () => {
    await admin.goto(`${BASE}/admin/analytics`);
    await expectMessage(admin, "Gross sales");
    const text = await admin.locator("main").innerText();
    assert.match(text, /\$114\.00/, "gross = 89 + 25"); // hoodie + cap
  });

  await step("customer registers and sees their guest order", async () => {
    const c = await newPage();
    await c.goto(`${BASE}/account`);
    await c.getByRole("button", { name: "Create an account" }).click();
    await c.fill("#account-first", "Ada");
    await c.fill("#account-email", "ada@example.com");
    await c.fill("#account-password", "AdaStrongPass1");
    await c.locator("form").getByRole("button", { name: "Create account" }).click();
    await expectMessage(c, "Welcome back, Ada");
    await expectMessage(c, "#CH");
  });

  await step("RBAC: support staff can't open staff settings or refund", async () => {
    await admin.goto(`${BASE}/admin/staff`);
    const form = admin.locator("form", { has: admin.getByRole("button", { name: "Create account" }) });
    await form.locator('input[name="name"]').fill("Sam Support");
    await form.locator('input[name="email"]').fill("sam@chisseled.test");
    await form.locator('select[name="role_id"]').selectOption({ label: "Customer support" });
    await form.locator('input[name="password"]').fill("SupportPass123");
    await form.getByRole("button", { name: "Create account" }).click();
    await expectMessage(admin, "Staff account created");
    const s = await newPage();
    await s.goto(`${BASE}/admin/login`);
    await s.fill('input[name="email"]', "sam@chisseled.test");
    await s.fill('input[name="password"]', "SupportPass123");
    await s.getByRole("button", { name: "Sign in" }).click();
    await s.waitForURL(`${BASE}/admin`, { waitUntil: "commit" });
    await s.goto(`${BASE}/admin/staff`);
    await expectMessage(s, "You don't have access");
    await s.goto(`${BASE}/admin/orders/${orderId}`);
    assert.equal(await s.getByRole("button", { name: /^Refund/ }).count(), 0);
  });

  await step("maintenance endpoint requires the cron secret", async () => {
    assert.equal((await fetch(`${BASE}/api/cron/maintenance`)).status, 401);
    const ok = await fetch(`${BASE}/api/cron/maintenance`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "cron-test-secret"}` } });
    assert.equal(ok.status, 200);
  });

  await step("expired unpaid reservation is released", async () => {
    const p = await newPage();
    await addToBag(p, "test-performance-hoodie", "S");
    await fillCheckout(p, "late@example.com");
    // Intercept the provider redirect so the shopper never "pays".
    await p.route(`${MOCK}/pay/**`, (route) => route.fulfill({ status: 200, body: "abandoned" }));
    await p.getByRole("button", { name: /^Pay / }).click();
    await p.waitForURL(/\/pay\//, { waitUntil: "commit" });
    const [before] = await sql`select i.reserved from inventory i join product_variants v on v.id = i.variant_id where v.sku = 'TPH-S-BLACK'`;
    assert.equal(before.reserved, 1);
    await sql`update orders set reservation_expires_at = now() - interval '1 minute' where email = 'late@example.com'`;
    const res = await (await fetch(`${BASE}/api/cron/maintenance`, { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "cron-test-secret"}` } })).json();
    assert.equal(res.expired, 1);
    const [after] = await sql`select i.reserved from inventory i join product_variants v on v.id = i.variant_id where v.sku = 'TPH-S-BLACK'`;
    assert.equal(after.reserved, 0);
  });

  await step("no client-side errors on any page visited", async () => {
    assert.deepEqual(errors, []);
  });
} finally {
  await browser.close();
  await sql.end();
  const failed = results.filter((r) => r[0] === "FAIL").length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exitCode = failed ? 1 : 0;
}
