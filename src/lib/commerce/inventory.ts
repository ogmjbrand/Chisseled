import { db, type Queryable, type Tx } from "@/lib/db";
import { notify } from "@/lib/commerce/audit";
import { UserFacingError } from "@/lib/security/validate";

/**
 * Inventory is the one place stock changes. Every function takes the caller's
 * transaction so stock and the order/refund that caused it commit together.
 *
 *   available = on_hand - reserved
 *
 * The table's CHECK (reserved <= on_hand) plus the conditional UPDATEs below
 * make overselling impossible even under concurrent checkouts: the second
 * buyer's UPDATE matches zero rows and their transaction rolls back.
 */

export type MovementReason =
  | "adjustment"
  | "restock"
  | "sale"
  | "reservation"
  | "reservation_release"
  | "return"
  | "damage"
  | "correction"
  | "import";

interface Line {
  variantId: string;
  quantity: number;
}

export class OutOfStockError extends UserFacingError {
  constructor(public variantId: string, public title: string, public available: number) {
    super(
      available > 0
        ? `Only ${available} of “${title}” left — reduce the quantity to continue.`
        : `“${title}” just sold out. Remove it to continue.`,
    );
  }
}

async function log(
  tx: Queryable,
  variantId: string,
  reason: MovementReason,
  dOnHand: number,
  dReserved: number,
  after: { on_hand: number; reserved: number },
  extra: { orderId?: string | null; staffId?: string | null; note?: string },
) {
  await tx`
    insert into inventory_movements
      (variant_id, reason, delta_on_hand, delta_reserved, on_hand_after, reserved_after, note, order_id, staff_id)
    values (${variantId}, ${reason}, ${dOnHand}, ${dReserved}, ${after.on_hand}, ${after.reserved},
            ${extra.note ?? ""}, ${extra.orderId ?? null}, ${extra.staffId ?? null})`;
}

async function checkLowStock(tx: Queryable, variantId: string) {
  const [row] = await tx<{ available: number; low_stock_threshold: number; title: string; product_title: string; product_id: string }[]>`
    select i.on_hand - i.reserved as available, i.low_stock_threshold, v.title, p.title as product_title, p.id as product_id
    from inventory i join product_variants v on v.id = i.variant_id join products p on p.id = v.product_id
    where i.variant_id = ${variantId}`;
  if (!row) return;
  const key = `low-stock:${variantId}`;
  if (row.available <= row.low_stock_threshold) {
    await notify(
      {
        kind: "low_stock",
        severity: row.available <= 0 ? "critical" : "warning",
        title: row.available <= 0 ? `Out of stock: ${row.product_title}` : `Low stock: ${row.product_title}`,
        body: `${row.title} — ${Math.max(0, row.available)} available (threshold ${row.low_stock_threshold}).`,
        entityType: "product",
        entityId: row.product_id,
        dedupeKey: key,
      },
      tx,
    );
  } else {
    // Back above threshold: release the dedupe key so the next dip alerts again.
    await tx`update notifications set dedupe_key = null where dedupe_key = ${key}`;
  }
}

/** Reserve stock for a pending order. Throws OutOfStockError (rolling back the tx) if any line can't be met. */
export async function reserve(tx: Tx, lines: Line[], orderId: string): Promise<void> {
  // Lock rows in a stable order to avoid deadlocks between concurrent checkouts.
  for (const line of [...lines].sort((a, b) => a.variantId.localeCompare(b.variantId))) {
    const [v] = await tx<{ track_inventory: boolean; title: string }[]>`
      select v.track_inventory, p.title || case when v.title <> 'Default' then ' — ' || v.title else '' end as title
      from product_variants v join products p on p.id = v.product_id where v.id = ${line.variantId}`;
    if (!v) throw new UserFacingError("An item in your bag is no longer available.");
    if (!v.track_inventory) continue;

    const [after] = await tx<{ on_hand: number; reserved: number }[]>`
      update inventory set reserved = reserved + ${line.quantity}
      where variant_id = ${line.variantId} and on_hand - reserved >= ${line.quantity}
      returning on_hand, reserved`;
    if (!after) {
      const [cur] = await tx<{ available: number }[]>`
        select greatest(on_hand - reserved, 0)::int as available from inventory where variant_id = ${line.variantId}`;
      throw new OutOfStockError(line.variantId, v.title, cur?.available ?? 0);
    }
    await log(tx, line.variantId, "reservation", 0, line.quantity, after, { orderId });
    await checkLowStock(tx, line.variantId);
  }
}

/** Order paid: reserved units become sold (leave on_hand and reserved). */
export async function commitReservation(tx: Tx, lines: Line[], orderId: string): Promise<void> {
  for (const line of lines) {
    const [after] = await tx<{ on_hand: number; reserved: number }[]>`
      update inventory i set on_hand = i.on_hand - ${line.quantity}, reserved = i.reserved - ${line.quantity}
      from product_variants v
      where i.variant_id = ${line.variantId} and v.id = i.variant_id and v.track_inventory
        and i.reserved >= ${line.quantity}
      returning i.on_hand, i.reserved`;
    if (after) await log(tx, line.variantId, "sale", -line.quantity, -line.quantity, after, { orderId });
  }
}

/**
 * Payment arrived after the reservation lapsed. Try to take stock directly;
 * returns the lines that could not be fulfilled from stock.
 */
export async function sellWithoutReservation(tx: Tx, lines: Line[], orderId: string): Promise<Line[]> {
  const short: Line[] = [];
  for (const line of lines) {
    const [v] = await tx<{ track_inventory: boolean }[]>`select track_inventory from product_variants where id = ${line.variantId}`;
    if (!v?.track_inventory) continue;
    const [after] = await tx<{ on_hand: number; reserved: number }[]>`
      update inventory set on_hand = on_hand - ${line.quantity}
      where variant_id = ${line.variantId} and on_hand - reserved >= ${line.quantity}
      returning on_hand, reserved`;
    if (after) {
      await log(tx, line.variantId, "sale", -line.quantity, 0, after, { orderId, note: "Sold after reservation expired" });
      await checkLowStock(tx, line.variantId);
    } else short.push(line);
  }
  return short;
}

/** Pending order cancelled/expired: give reserved units back. */
export async function releaseReservation(tx: Tx, lines: Line[], orderId: string, note = ""): Promise<void> {
  for (const line of lines) {
    const [after] = await tx<{ on_hand: number; reserved: number }[]>`
      update inventory i set reserved = greatest(i.reserved - ${line.quantity}, 0)
      from product_variants v
      where i.variant_id = ${line.variantId} and v.id = i.variant_id and v.track_inventory
      returning i.on_hand, i.reserved`;
    if (after) {
      await log(tx, line.variantId, "reservation_release", 0, -line.quantity, after, { orderId, note });
      await checkLowStock(tx, line.variantId);
    }
  }
}

/** Returned / cancelled-after-payment units go back on the shelf. */
export async function restock(tx: Tx, lines: Line[], orderId: string | null, staffId: string | null, note = ""): Promise<void> {
  for (const line of lines) {
    if (line.quantity <= 0) continue;
    const [after] = await tx<{ on_hand: number; reserved: number }[]>`
      update inventory set on_hand = on_hand + ${line.quantity}
      where variant_id = ${line.variantId} returning on_hand, reserved`;
    if (after) {
      await log(tx, line.variantId, "return", line.quantity, 0, after, { orderId, staffId, note });
      await checkLowStock(tx, line.variantId);
    }
  }
}

/**
 * Manual stock change from the admin. `mode: "set"` sets on_hand to an
 * absolute count; `mode: "delta"` adds/subtracts. Refuses to drop on_hand
 * below what is already reserved for unpaid orders.
 */
export async function adjust(
  tx: Tx,
  input: {
    variantId: string;
    mode: "set" | "delta";
    quantity: number;
    reason: MovementReason;
    note: string;
    staffId: string | null;
    lowStockThreshold?: number | null;
  },
): Promise<{ on_hand: number; reserved: number }> {
  await tx`insert into inventory (variant_id) values (${input.variantId}) on conflict do nothing`;
  const [cur] = await tx<{ on_hand: number; reserved: number }[]>`
    select on_hand, reserved from inventory where variant_id = ${input.variantId} for update`;
  const target = input.mode === "set" ? input.quantity : cur.on_hand + input.quantity;
  if (target < 0) throw new UserFacingError("Stock can't go below zero.");
  if (target < cur.reserved) {
    throw new UserFacingError(`${cur.reserved} units are reserved by unpaid orders — on hand can't go below that.`);
  }
  const [after] = await tx<{ on_hand: number; reserved: number }[]>`
    update inventory set on_hand = ${target},
      low_stock_threshold = coalesce(${input.lowStockThreshold ?? null}, low_stock_threshold)
    where variant_id = ${input.variantId} returning on_hand, reserved`;
  if (target !== cur.on_hand) {
    await log(tx, input.variantId, input.reason, target - cur.on_hand, 0, after, { staffId: input.staffId, note: input.note });
  }
  await checkLowStock(tx, input.variantId);
  return after;
}

export async function availableFor(variantIds: string[], q: Queryable = db()): Promise<Map<string, number | null>> {
  if (variantIds.length === 0) return new Map();
  const rows = await q<{ id: string; track_inventory: boolean; available: number | null }[]>`
    select v.id, v.track_inventory, (i.on_hand - i.reserved)::int as available
    from product_variants v left join inventory i on i.variant_id = v.id
    where v.id = any(${variantIds}::uuid[])`;
  return new Map(rows.map((r) => [r.id, r.track_inventory ? Math.max(0, r.available ?? 0) : null]));
}
