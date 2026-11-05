"use server";

import { adminAction } from "@/lib/admin/action";
import { db } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { addEvent, cancelOrder, createShipment, refundOrder, updateShipment, verifyAndApplyPayment } from "@/lib/commerce/orders";
import { requirePermission } from "@/lib/auth/staff";
import { UserFacingError, bool, oneOf, optMoney, optStr, str, uuid } from "@/lib/security/validate";

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
