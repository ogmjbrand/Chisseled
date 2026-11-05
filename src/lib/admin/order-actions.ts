"use server";

import { adminAction } from "@/lib/admin/action";
import { db } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addEvent,
  cancelOrder,
  createManualOrder,
  createPaymentLink,
  createShipment,
  recordManualPayment,
  refundOrder,
  updateShipment,
  verifyAndApplyPayment,
} from "@/lib/commerce/orders";
import { ForbiddenError, requirePermission } from "@/lib/auth/staff";
import {
  UserFacingError,
  bool,
  country,
  email as emailField,
  oneOf,
  optMoney,
  optStr,
  str,
  toActionError,
  uuid,
  type ActionState,
} from "@/lib/security/validate";

export const cancelOrderAction = adminAction("orders:write", async (staff, form) => {
  const id = uuid(form, "id");
  await cancelOrder(id, str(form, "reason", { max: 300, label: "Reason" }), { restock: bool(form, "restock") }, staff);
  return "Order cancelled.";
});

export const noteAction = adminAction("orders:write", async (staff, form) => {
  const id = uuid(form, "id");
  const note = str(form, "note", { max: 2000, label: "Note" });
  await addEvent(db(), id, "note", note, {}, staff.id);
  await audit(staff, "order.note", "order", id, {});
  return "Note added.";
});

export const fulfilAction = adminAction("fulfillment:write", async (staff, form) => {
  const id = uuid(form, "id");
  const ids = form.getAll("item_ids").map(String);
  const items = ids.map((itemId) => ({
    orderItemId: itemId,
    quantity: Math.max(0, Math.trunc(Number(form.get(`qty.${itemId}`) ?? 0)) || 0),
  }));
  const url = optStr(form, "tracking_url", { max: 500 });
  if (url && !/^https:\/\//.test(url)) throw new UserFacingError("Tracking URL must start with https://");
  await createShipment(id, {
    items,
    carrier: optStr(form, "carrier", { max: 80 }),
    trackingNumber: optStr(form, "tracking_number", { max: 120 }),
    trackingUrl: url || null,
    notify: bool(form, "notify"),
  }, staff);
  return "Shipment created.";
});

export const shipmentAction = adminAction("fulfillment:write", async (staff, form) => {
  const url = optStr(form, "tracking_url", { max: 500 });
  if (url && !/^https:\/\//.test(url)) throw new UserFacingError("Tracking URL must start with https://");
  await updateShipment(uuid(form, "shipment_id"), {
    status: oneOf(form, "status", ["pending", "in_transit", "out_for_delivery", "delivered", "failed", "returned"] as const),
    carrier: optStr(form, "carrier", { max: 80 }),
    trackingNumber: optStr(form, "tracking_number", { max: 120 }),
    trackingUrl: url || null,
  }, staff);
  return "Shipment updated.";
});

export const refundAction = adminAction("refunds:write", async (staff, form) => {
  const id = uuid(form, "id");
  const amount = optMoney(form, "amount", "Refund amount");
  if (!amount) throw new UserFacingError("Enter a refund amount.");
  const restockItems = form.getAll("item_ids").map(String).map((itemId) => ({
    orderItemId: itemId,
    quantity: Math.max(0, Math.trunc(Number(form.get(`restock.${itemId}`) ?? 0)) || 0),
  }));
  const { status } = await refundOrder(id, { amountCents: amount, reason: optStr(form, "reason", { max: 300 }), restockItems }, staff);
  if (status === "failed") throw new UserFacingError("The provider rejected the refund. See the timeline for details.");
  return status === "pending" ? "Refund submitted — the provider will confirm it shortly." : "Refund completed.";
});

export const reverifyAction = adminAction("orders:write", async (staff, form) => {
  await requirePermission("payments:read");
  const id = uuid(form, "id");
  const payments = await db()<{ provider: string; reference: string }[]>`
    select provider, reference from payments where order_id = ${id} order by created_at desc`;
  if (!payments.length) throw new UserFacingError("No payment attempts on this order.");
  const results: string[] = [];
  for (const p of payments) {
    const r = await verifyAndApplyPayment(p.provider, p.reference);
    results.push(`${p.reference}: ${r.outcome.replace("_", " ")}`);
  }
  await audit(staff, "order.reverify", "order", id, { results });
  return `Checked with provider — ${results.join("; ")}.`;
});

export const staffNoteAction = adminAction("orders:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`update orders set staff_note = ${optStr(form, "staff_note", { max: 4000 })} where id = ${id}`;
  await audit(staff, "order.staff_note", "order", id, {});
  return "Saved.";
});

/* ------------------------- staff-created orders ------------------------- */

export const recordPaymentAction = adminAction("orders:write", async (staff, form) => {
  await requirePermission("payments:read");
  const id = uuid(form, "id");
  const method = str(form, "method", { max: 60, label: "Payment method" });
  const outcome = await recordManualPayment(id, { method, externalRef: optStr(form, "external_ref", { max: 120 }) }, staff);
  if (outcome === "paid") return `Payment recorded (${method}). Stock committed and the order is ready to fulfil.`;
  if (outcome === "already_paid") return "This order was already paid.";
  throw new UserFacingError("Couldn't record the payment.");
});

export const paymentLinkAction = adminAction("orders:write", async (staff, form) => {
  const id = uuid(form, "id");
  const provider = oneOf(form, "provider", ["paystack", "flutterwave", "stripe"] as const);
  const holdHours = Math.min(168, Math.max(1, Number(form.get("hold_hours") ?? 48) || 48));
  const url = await createPaymentLink(id, { provider, origin: await siteOrigin(), holdHours }, staff);
  return `Payment link (send this to the customer): ${url}`;
});

export async function createManualOrderAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let orderId: string;
  try {
    const staff = await requirePermission("orders:write");
    const variantIds = form.getAll("variant_id").map(String);
    const qtys = form.getAll("qty").map((q) => Math.trunc(Number(q)));
    const lines = variantIds
      .map((variantId, i) => ({ variantId, quantity: qtys[i] }))
      .filter((l) => /^[0-9a-f-]{36}$/i.test(l.variantId) && Number.isInteger(l.quantity) && l.quantity > 0 && l.quantity <= 99);
    const shippingName = optStr(form, "shipping_name", { max: 80 }) || "Delivery";
    const shippingPrice = optMoney(form, "shipping_price", "Delivery fee") ?? 0;
    const order = await createManualOrder(
      {
        lines,
        email: emailField(form),
        phone: optStr(form, "phone", { max: 30 }),
        acceptsMarketing: false,
        shippingAddress: {
          firstName: str(form, "firstName", { max: 80, label: "First name" }),
          lastName: optStr(form, "lastName", { max: 80 }),
          line1: str(form, "line1", { max: 200, label: "Address" }),
          line2: optStr(form, "line2", { max: 200 }),
          city: str(form, "city", { max: 120, label: "City" }),
          region: optStr(form, "region", { max: 120 }),
          postalCode: optStr(form, "postalCode", { max: 20 }),
          country: country(form, "country"),
          phone: optStr(form, "phone", { max: 30 }),
        },
        shippingRateId: null,
        shippingOverride: { name: shippingName, priceCents: shippingPrice },
        discountCode: optStr(form, "discountCode", { max: 64 }) || null,
        customerNote: optStr(form, "note", { max: 1000 }),
        holdMinutes: Math.min(168, Math.max(1, Number(form.get("hold_hours") ?? 48) || 48)) * 60,
      },
      staff,
    );
    orderId = order.orderId;
  } catch (err) {
    if (err instanceof ForbiddenError) return { ok: false, error: err.message };
    return toActionError(err);
  }
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${orderId}?created=1`);
}

async function siteOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}
