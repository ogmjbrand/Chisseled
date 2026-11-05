import { db } from "@/lib/db";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

/**
 * Transactional email via Resend's HTTP API (RESEND_API_KEY + EMAIL_FROM).
 * When not configured, nothing is sent and the order timeline says so —
 * the on-site confirmation page is always available regardless.
 */

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function siteUrl(): string {
  return (process.env.APP_URL ?? "").replace(/\/$/, "");
}

/** Minimal, client-safe HTML shell shared by every transactional email. */
export function emailLayout(body: string, footer = ""): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">
    <p style="font-weight:800;letter-spacing:.04em;text-transform:uppercase">CHISSELED</p>
    ${body}
    <p style="margin-top:32px;color:#777;font-size:12px">${footer || "You're receiving this because of activity on your CHISSELED account or order."}</p>
  </div>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) return false;
  const res = await fetch(`${process.env.RESEND_BASE_URL || "https://api.resend.com"}/emails`, {
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

/** Shipping / cancellation / refund notices for an order. Best-effort; logs to the order timeline. */
export async function sendOrderUpdate(
  orderId: string,
  kind: "shipped" | "delivered" | "cancelled" | "refunded",
  extra: { carrier?: string; trackingNumber?: string; trackingUrl?: string | null; amountCents?: number } = {},
): Promise<void> {
  const settings = await getStoreSettings();
  const [o] = await db()<{ number: number; email: string; currency: string }[]>`select number, email, currency from orders where id = ${orderId}`;
  if (!o) return;
  const name = orderName(o.number, settings.order_prefix);
  const tracking = extra.trackingNumber
    ? `<p>${escapeHtml(extra.carrier ?? "")} tracking: ${extra.trackingUrl ? `<a href="${escapeHtml(extra.trackingUrl)}">${escapeHtml(extra.trackingNumber)}</a>` : escapeHtml(extra.trackingNumber)}</p>`
    : "";
  const copy = {
    shipped: [`Order ${name} is on its way`, `<h1 style="font-size:20px">It's on its way.</h1><p>Your order ${name} has shipped.</p>${tracking}`],
    delivered: [`Order ${name} was delivered`, `<h1 style="font-size:20px">Delivered.</h1><p>Your order ${name} has been delivered. Train well.</p>`],
    cancelled: [`Order ${name} was cancelled`, `<h1 style="font-size:20px">Your order was cancelled.</h1><p>Order ${name} has been cancelled. If you paid, any refund is shown in a separate email.</p>`],
    refunded: [`Refund for order ${name}`, `<h1 style="font-size:20px">Refund issued.</h1><p>We've refunded ${formatMoney(extra.amountCents ?? 0, o.currency)} for order ${name}. Depending on your bank it can take a few days to appear.</p>`],
  }[kind];
  let sent = false;
  try {
    sent = await sendEmail(o.email, copy[0], emailLayout(`${copy[1]}<p style="color:#666">${escapeHtml(settings.name)}</p>`));
  } catch (err) {
    console.error("[email] order update failed", err);
  }
  await db()`insert into order_events (order_id, kind, message) values
    (${orderId}, 'email', ${sent ? `“${kind}” email sent to ${o.email}` : `“${kind}” email not sent — email provider not configured`})`;
}
