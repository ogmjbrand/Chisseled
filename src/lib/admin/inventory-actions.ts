"use server";

import { adminAction } from "@/lib/admin/action";
import { transaction } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { adjust, type MovementReason } from "@/lib/commerce/inventory";
import { int, oneOf, optInt, optStr, uuid } from "@/lib/security/validate";

const REASONS = ["adjustment", "restock", "damage", "correction", "return"] as const;

export const adjustStockAction = adminAction("inventory:write", async (staff, form) => {
  const variantId = uuid(form, "variant_id");
  const mode = oneOf(form, "mode", ["delta", "set"] as const, "delta");
  const quantity = int(form, "quantity", { min: mode === "set" ? 0 : -1_000_000, max: 1_000_000, label: "Quantity" });
  const reason = oneOf(form, "reason", REASONS, "adjustment") as MovementReason;
  const note = optStr(form, "note", { max: 300 });
  const threshold = optInt(form, "threshold", { min: 0, max: 100_000 });
  const after = await transaction(async (tx) => {
    const res = await adjust(tx, { variantId, mode, quantity, reason, note, staffId: staff.id, lowStockThreshold: threshold });
    await audit(staff, "inventory.adjust", "variant", variantId, { mode, quantity, reason, note, on_hand: res.on_hand }, tx);
    return res;
  });
  return `Stock updated — ${after.on_hand} on hand, ${after.on_hand - after.reserved} available.`;
});
