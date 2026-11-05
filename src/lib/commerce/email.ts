import { db } from "@/lib/db";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

/**
 * Transactional email via Resend's HTTP API (RESEND_API_KEY + EMAIL_FROM).
 * When not configured, nothing is sent and the order timeline says so —
 * the on-site confirmation page is always available regardless.
 */

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
  return true;
}

export async function sendOrderConfirmation(orderId: string): Promise<void> {
  const settings = await getStoreSettings();
  const [o] = await db()<{ number: number; email: string; currency: string; total_cents: number; shipping_method: string }[]>`
    select number, email, currency, total_cents, shipping_method from orders where id = ${orderId}`;
  if (!o) return;
  const items = await db()<{ title: string; variant_title: string; quantity: number; total_cents: number }[]>`
    select title, variant_title, quantity, total_cents from order_items where order_id = ${orderId}`;
  const rows = items
    .map((i) => `<tr><td>${escapeHtml(i.title)}${i.variant_title ? ` — ${escapeHtml(i.variant_title)}` : ""} × ${i.quantity}</td>
      <td style="text-align:right">${formatMoney(i.total_cents, o.currency)}</td></tr>`)
    .join("");
  const name = orderName(o.number, settings.order_prefix);
  const html = `<div style="font-family:system-ui,sans-serif;max-width:560px">
    <h1 style="font-size:20px">Thank you — order ${name} is confirmed.</h1>
    <p>We've received your payment and are preparing your order. We'll email you tracking details when it ships.</p>
    <table style="width:100%;border-collapse:collapse">${rows}
      <tr><td><strong>Total</strong></td><td style="text-align:right"><strong>${formatMoney(o.total_cents, o.currency)}</strong></td></tr></table>
    <p style="color:#666">Delivery: ${escapeHtml(o.shipping_method)}</p>
    <p style="color:#666">${escapeHtml(settings.name)}</p></div>`;
  const sent = await sendEmail(o.email, `${settings.name} order ${name} confirmed`, html);
  await db()`insert into order_events (order_id, kind, message) values
    (${orderId}, 'email', ${sent ? `Confirmation email sent to ${o.email}` : "Confirmation email not sent — email provider not configured"})`;
}
