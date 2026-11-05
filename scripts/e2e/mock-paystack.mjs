// Paystack-compatible test double for end-to-end tests. Implements the four
// endpoints the app calls, and a "hosted page" that redirects back to the
// store's callback just like the real one. Never used in production.
import http from "node:http";
import { createHmac } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 4010);
const SECRET = process.env.PAYSTACK_SECRET_KEY ?? "sk_test_mock";
const tx = new Map();
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
    if (url.pathname.startsWith("/pay/")) {
      const t = tx.get(decodeURIComponent(url.pathname.slice(5)));
      if (!t) return json(res, 404, { status: false });
      t.status = url.searchParams.get("outcome") === "fail" ? "failed" : "success";
      res.writeHead(302, { Location: t.callback_url });
      return res.end();
    }
    if (url.pathname === "/__state") return json(res, 200, Object.fromEntries(tx));
    if (url.pathname === "/__sign") {
      return json(res, 200, { signature: createHmac("sha512", SECRET).update(body).digest("hex") });
    }
    if (auth !== `Bearer ${SECRET}`) return json(res, 401, { status: false, message: "Invalid key" });

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
  .listen(PORT, "127.0.0.1", () => console.log(`mock paystack on ${PORT}`));
