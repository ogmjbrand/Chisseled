// Payment + email test doubles for end-to-end tests (never used in production):
//   Paystack  — /transaction/initialize, /transaction/verify/:ref, /refund, hosted page /pay/:ref
//   Stripe    — /v1/checkout/sessions, /v1/checkout/sessions/:id, /v1/refunds, hosted page /stripe-pay/:id
//   Resend    — POST /emails (captured; read back from /__emails)
import http from "node:http";
import { createHmac } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const PAYSTACK = process.env.PAYSTACK_SECRET_KEY ?? "sk_test_mock";
const STRIPE = process.env.STRIPE_SECRET_KEY ?? "sk_test_stripe_mock";
const RESEND = process.env.RESEND_API_KEY ?? "re_test_mock";
const tx = new Map();
const sessions = new Map();
const emails = [];
let nextId = 9000;

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
    let body = "";
    for await (const c of req) body += c;
    const auth = req.headers.authorization;

    // ---- test helpers & hosted pages (no auth)
    if (url.pathname === "/__emails") return json(res, 200, emails);
    if (url.pathname === "/__sign") return json(res, 200, { signature: createHmac("sha512", PAYSTACK).update(body).digest("hex") });
    if (url.pathname.startsWith("/pay/")) {
      const t = tx.get(decodeURIComponent(url.pathname.slice(5)));
      if (!t) return json(res, 404, { status: false });
      t.status = url.searchParams.get("outcome") === "fail" ? "failed" : "success";
      res.writeHead(302, { Location: t.callback_url });
      return res.end();
    }
    if (url.pathname.startsWith("/stripe-pay/")) {
      const s = sessions.get(decodeURIComponent(url.pathname.slice(12)));
      if (!s) return json(res, 404, {});
      s.status = "complete";
      s.payment_status = "paid";
      res.writeHead(302, { Location: s.success_url });
      return res.end();
    }

    // ---- Resend
    if (url.pathname === "/emails") {
      if (auth !== `Bearer ${RESEND}`) return json(res, 401, { message: "bad key" });
      const m = JSON.parse(body);
      emails.push(m);
      return json(res, 200, { id: `em_${emails.length}` });
    }

    // ---- Stripe
    if (url.pathname.startsWith("/v1/")) {
      if (auth !== `Bearer ${STRIPE}`) return json(res, 401, { error: { message: "Invalid API Key" } });
      const f = Object.fromEntries(new URLSearchParams(body));
      if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
        const id = `cs_test_${nextId++}`;
        const s = {
          id, status: "open", payment_status: "unpaid", client_reference_id: f.client_reference_id,
          amount_total: Number(f["line_items[0][price_data][unit_amount]"]), currency: f["line_items[0][price_data][currency]"],
          payment_intent: `pi_test_${nextId++}`, success_url: f.success_url, url: `http://127.0.0.1:${PORT}/stripe-pay/${id}`,
        };
        sessions.set(id, s);
        return json(res, 200, s);
      }
      if (req.method === "GET" && url.pathname.startsWith("/v1/checkout/sessions/")) {
        const s = sessions.get(decodeURIComponent(url.pathname.split("/").pop()));
        return s ? json(res, 200, s) : json(res, 404, { error: { message: "No such session" } });
      }
      if (req.method === "POST" && url.pathname === "/v1/refunds") {
        return json(res, 200, { id: `re_${nextId++}`, status: "succeeded", payment_intent: f.payment_intent, amount: Number(f.amount) });
      }
      return json(res, 404, { error: { message: "unknown endpoint" } });
    }

    // ---- Paystack
    if (auth !== `Bearer ${PAYSTACK}`) return json(res, 401, { status: false, message: "Invalid key" });
    if (req.method === "POST" && url.pathname === "/transaction/initialize") {
      const b = JSON.parse(body);
      const id = nextId++;
      tx.set(b.reference, { id, ...b, status: "abandoned" });
      return json(res, 200, { status: true, message: "ok", data: { authorization_url: `http://127.0.0.1:${PORT}/pay/${encodeURIComponent(b.reference)}`, reference: b.reference } });
    }
    if (req.method === "GET" && url.pathname.startsWith("/transaction/verify/")) {
      const t = tx.get(decodeURIComponent(url.pathname.split("/").pop()));
      if (!t) return json(res, 404, { status: false, message: "not found" });
      return json(res, 200, { status: true, message: "ok", data: { id: t.id, status: t.status, amount: t.amount, currency: t.currency, channel: "card", fees: Math.round(t.amount * 0.015), gateway_response: t.status === "success" ? "Approved" : "Declined", reference: t.reference } });
    }
    if (req.method === "POST" && url.pathname === "/refund") {
      const b = JSON.parse(body);
      return json(res, 200, { status: true, message: "Refund queued", data: { id: nextId++, status: "processed", transaction: b.transaction, amount: b.amount } });
    }
    json(res, 404, { status: false, message: "unknown endpoint" });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock providers on ${PORT}`));
