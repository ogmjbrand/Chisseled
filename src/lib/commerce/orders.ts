import { db, transaction, type Queryable, type Tx } from "@/lib/db";
import { audit, notify } from "@/lib/commerce/audit";
import { loadCart } from "@/lib/commerce/cart";
import {
  commitReservation,
  releaseReservation,
  reserve,
  restock,
  sellWithoutReservation,
} from "@/lib/commerce/inventory";
import { computeTotals } from "@/lib/commerce/pricing";
import { readSetting, DEFAULT_STORE, orderName, type StoreSettings } from "@/lib/commerce/settings";
import { sendOrderConfirmation } from "@/lib/commerce/email";
import { getProvider } from "@/lib/payments";
import type { ProviderId, VerifiedPayment } from "@/lib/payments/types";
import { randomToken, sha256 } from "@/lib/security/crypto";
import { UserFacingError } from "@/lib/security/validate";
import type { StaffUser } from "@/lib/auth/staff";

export interface Address {
  firstName: string;
  lastName: string;
  company?: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  phone?: string;
}

interface OrderLine {
  variantId: string;
  quantity: number;
}

async function orderLines(tx: Queryable, orderId: string): Promise<OrderLine[]> {
  const rows = await tx<{ variant_id: string | null; quantity: number }[]>`
    select variant_id, quantity from order_items where order_id = ${orderId} and variant_id is not null`;
  return rows.map((r) => ({ variantId: r.variant_id!, quantity: r.quantity }));
}

export async function addEvent(
  tx: Queryable,
  orderId: string,
  kind: string,
  message: string,
  data: Record<string, unknown> = {},
  staffId: string | null = null,
) {
  await tx`insert into order_events (order_id, kind, message, data, staff_id)
           values (${orderId}, ${kind}, ${message}, ${tx.json(data as never)}, ${staffId})`;
}

/* =====================================================================
   CHECKOUT
   ===================================================================== */

export interface CheckoutInput {
  cartId: string;
  customerId: string | null;
  email: string;
  phone: string;
  acceptsMarketing: boolean;
  shippingAddress: Address;
  shippingRateId: string | null;
  discountCode: string | null;
  provider: ProviderId;
  customerNote: string;
}

export interface CreatedOrder {
  orderId: string;
  number: number;
  accessToken: string;
  totalCents: number;
  currency: string;
}

/**
 * Turns a cart into a pending order in ONE transaction: prices recomputed
 * from the database, discount usage claimed, stock reserved. If any line is
 * short the whole thing rolls back and the customer sees exactly which item.
 */
export async function createOrderFromCart(input: CheckoutInput): Promise<CreatedOrder> {
  return transaction(async (tx) => {
    const [cartRow] = await tx<{ id: string; status: string }[]>`
      select id, status from carts where id = ${input.cartId} for update`;
    if (!cartRow || cartRow.status !== "active") throw new UserFacingError("Your bag has expired. Add your items again.");

    // A previous unpaid attempt from this same bag is superseded.
    const stale = await tx<{ id: string }[]>`
      select id from orders where cart_id = ${input.cartId} and payment_status = 'pending' and status = 'pending'
      for update`;
    for (const s of stale) await cancelPendingInTx(tx, s.id, "Superseded by a new checkout attempt", null);

    const cart = await loadCart(input.cartId, tx);
    if (!cart || cart.items.length === 0) throw new UserFacingError("Your bag is empty.");
    const unavailable = cart.items.find((i) => !i.purchasable);
    if (unavailable) {
      throw new UserFacingError(
        unavailable.available && unavailable.available > 0
          ? `Only ${unavailable.available} of “${unavailable.name}” left — update your bag to continue.`
          : `“${unavailable.name}” is no longer available — remove it to continue.`,
      );
    }

    const settings = await readSetting<StoreSettings>("store", DEFAULT_STORE, tx);

    const totals = await computeTotals(
      {
        lines: cart.items.map((i) => ({
          variantId: i.variantId,
          productId: i.productId,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
        })),
        discountCode: input.discountCode,
        email: input.email,
        country: input.shippingAddress.country,
        shippingRateId: input.shippingRateId,
        settings,
        lockDiscount: true,
      },
      tx,
    );
    if (input.discountCode && totals.discountError) throw new UserFacingError(totals.discountError);
    if (totals.shippingError || !totals.shippingRate) throw new UserFacingError(totals.shippingError ?? "Choose a delivery option.");
    if (totals.totalCents <= 0) throw new UserFacingError("This order total can't be charged online. Contact support.");

    // Customer: signed-in account, or a guest record keyed by email.
    let customerId = input.customerId;
    if (!customerId) {
      const [c] = await tx<{ id: string }[]>`
        insert into customers (email, first_name, last_name, phone, accepts_marketing)
        values (${input.email}, ${input.shippingAddress.firstName}, ${input.shippingAddress.lastName}, ${input.phone}, ${input.acceptsMarketing})
        on conflict (email) do update set
          first_name = coalesce(nullif(customers.first_name, ''), excluded.first_name),
          last_name = coalesce(nullif(customers.last_name, ''), excluded.last_name),
          phone = coalesce(nullif(customers.phone, ''), excluded.phone),
          accepts_marketing = customers.accepts_marketing or excluded.accepts_marketing
        returning id`;
      customerId = c.id;
    }

    const accessToken = randomToken(24);
    const address = { ...input.shippingAddress };
    const [order] = await tx<{ id: string; number: number }[]>`
      insert into orders (
        customer_id, cart_id, email, phone, currency, subtotal_cents, discount_cents, shipping_cents, tax_cents,
        total_cents, discount_id, discount_code, shipping_rate_id, shipping_method, shipping_address, billing_address,
        customer_note, payment_provider, access_token_hash, reservation_expires_at)
      values (
        ${customerId}, ${input.cartId}, ${input.email}, ${input.phone}, ${settings.currency},
        ${totals.subtotalCents}, ${totals.discountCents}, ${totals.shippingCents}, ${totals.taxCents}, ${totals.totalCents},
        ${totals.discount?.id ?? null}, ${totals.discount?.code ?? null}, ${totals.shippingRate.id}, ${totals.shippingRate.name},
        ${tx.json(address as never)}, ${tx.json(address as never)}, ${input.customerNote}, ${input.provider},
        ${sha256(accessToken)}, now() + make_interval(mins => ${settings.reservation_minutes}))
      returning id, number`;

    for (const i of cart.items) {
      await tx`
        insert into order_items (order_id, product_id, variant_id, title, variant_title, sku, image_url,
                                 unit_price_cents, unit_cost_cents, quantity, total_cents)
        values (${order.id}, ${i.productId}, ${i.variantId}, ${i.name}, ${i.variantTitle === "Default" ? "" : i.variantTitle},
                ${i.sku}, ${i.imageUrl}, ${i.unitPriceCents}, ${i.unitCostCents}, ${i.quantity}, ${i.unitPriceCents * i.quantity})`;
    }

    await reserve(tx, cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), order.id);

    if (totals.discount) {
      await tx`insert into discount_redemptions (discount_id, order_id, customer_id, email, amount_cents)
               values (${totals.discount.id}, ${order.id}, ${customerId}, ${input.email}, ${totals.discountCents})`;
      await tx`update discounts set times_used = times_used + 1 where id = ${totals.discount.id}`;
    }

    await tx`update carts set email = ${input.email}, customer_id = coalesce(customer_id, ${customerId}) where id = ${input.cartId}`;
    await addEvent(tx, order.id, "created", "Order placed — awaiting payment", {
      total_cents: totals.totalCents,
      provider: input.provider,
    });

    return {
      orderId: order.id,
      number: order.number,
      accessToken,
      totalCents: totals.totalCents,
      currency: settings.currency,
    };
  });
}

/** Creates the payment row and asks the provider for a hosted payment page. */
export async function initializePayment(
  order: CreatedOrder,
  input: { provider: ProviderId; email: string; name: string; phone: string; callbackUrl: string },
): Promise<string> {
  const provider = getProvider(input.provider);
  if (!provider?.isConfigured()) throw new UserFacingError("That payment method isn't available.");
  const reference = `CH${order.number}-${randomToken(6).replace(/[^a-zA-Z0-9]/g, "")}`;
  const [payment] = await db()<{ id: string }[]>`
    insert into payments (order_id, provider, reference, amount_cents, currency)
    values (${order.orderId}, ${provider.id}, ${reference}, ${order.totalCents}, ${order.currency}) returning id`;
  try {
    const { authorizationUrl, raw } = await provider.initialize({
      reference,
      amountCents: order.totalCents,
      currency: order.currency,
      email: input.email,
      name: input.name,
      phone: input.phone,
      callbackUrl: `${input.callbackUrl}${input.callbackUrl.includes("?") ? "&" : "?"}provider=${provider.id}&reference=${encodeURIComponent(reference)}`,
      orderId: order.orderId,
      orderNumber: order.number,
    });
    if (!/^https:\/\//.test(authorizationUrl) && process.env.NODE_ENV === "production") {
      throw new Error("Provider returned a non-HTTPS payment URL");
    }
    await db()`update payments set status = 'pending', authorization_url = ${authorizationUrl}, raw = ${db().json(raw as never)}
               where id = ${payment.id}`;
    await addEvent(db(), order.orderId, "payment_initialized", `Payment started with ${provider.id}`, { reference });
    return authorizationUrl;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Payment initialisation failed";
    await db()`update payments set status = 'failed', failure_reason = ${message.slice(0, 500)} where id = ${payment.id}`;
    await addEvent(db(), order.orderId, "payment_failed", "Could not start payment", { reference, error: message.slice(0, 300) });
    throw new UserFacingError("We couldn't connect to the payment provider. Your card was not charged — please try again.");
  }
}

/* =====================================================================
   PAYMENT VERIFICATION (idempotent — safe to call from redirect + webhook)
   ===================================================================== */

export type VerificationOutcome = "paid" | "already_paid" | "failed" | "pending" | "mismatch" | "unknown";

export async function verifyAndApplyPayment(providerId: string, reference: string): Promise<{ outcome: VerificationOutcome; orderId: string | null }> {
  const provider = getProvider(providerId);
  if (!provider) return { outcome: "unknown", orderId: null };
  const [existing] = await db()<{ order_id: string; status: string; provider: string }[]>`
    select order_id, status, provider from payments where reference = ${reference}`;
  if (!existing || existing.provider !== provider.id) return { outcome: "unknown", orderId: null };
  if (existing.status === "succeeded") return { outcome: "already_paid", orderId: existing.order_id };

  // Never trust the redirect query string or webhook body — ask the provider.
  const verified = await provider.verify(reference);
  const outcome = await applyVerifiedPayment(reference, verified);
  return { outcome, orderId: existing.order_id };
}

export async function applyVerifiedPayment(reference: string, v: VerifiedPayment): Promise<VerificationOutcome> {
  let paidOrderId: string | null = null;
  const outcome = await transaction(async (tx): Promise<VerificationOutcome> => {
    const [p] = await tx<{ id: string; order_id: string; status: string; amount_cents: number; currency: string; provider: string }[]>`
      select id, order_id, status, amount_cents, currency, provider from payments where reference = ${reference} for update`;
    if (!p) return "unknown";
    if (p.status === "succeeded") return "already_paid";

    const [order] = await tx<{ id: string; number: number; status: string; payment_status: string; inventory_state: string; discount_id: string | null; email: string; customer_id: string | null; discount_cents: number; cart_id: string | null }[]>`
      select id, number, status, payment_status, inventory_state, discount_id, email, customer_id, discount_cents, cart_id
      from orders where id = ${p.order_id} for update`;

    if (v.status !== "succeeded") {
      await tx`update payments set status = ${v.status === "pending" ? "pending" : v.status},
               failure_reason = ${v.failureReason}, raw = ${tx.json(v.raw as never)} where id = ${p.id}`;
      if (v.status !== "pending") await addEvent(tx, order.id, "payment_failed", `Payment ${v.status}`, { reference, reason: v.failureReason });
      return v.status === "pending" ? "pending" : "failed";
    }

    if (v.amountCents < p.amount_cents || v.currency !== p.currency) {
      await tx`update payments set status = 'failed', failure_reason = 'Amount or currency mismatch',
               provider_transaction_id = ${v.transactionId}, raw = ${tx.json(v.raw as never)} where id = ${p.id}`;
      await tx`update orders set flags = array_append(flags, 'payment_mismatch') where id = ${order.id}`;
      await addEvent(tx, order.id, "payment_mismatch", "Provider reported a different amount or currency — not fulfilled", {
        expected: p.amount_cents, expected_currency: p.currency, received: v.amountCents, received_currency: v.currency,
      });
      await notify({ kind: "payment_mismatch", severity: "critical", title: `Payment mismatch on ${orderName(order.number)}`,
        body: `Expected ${p.amount_cents} ${p.currency}, provider reported ${v.amountCents} ${v.currency}.`,
        entityType: "order", entityId: order.id }, tx);
      return "mismatch";
    }

    await tx`update payments set status = 'succeeded', provider_transaction_id = ${v.transactionId}, channel = ${v.channel},
             fee_cents = ${v.feeCents}, raw = ${tx.json(v.raw as never)}, verified_at = now() where id = ${p.id}`;

    const lines = await orderLines(tx, order.id);
    if (order.inventory_state === "reserved") {
      await commitReservation(tx, lines, order.id);
    } else if (order.inventory_state === "released") {
      // The reservation lapsed (or the order was cancelled) before the money arrived.
      const short = await sellWithoutReservation(tx, lines, order.id);
      if (short.length) {
        await tx`update orders set flags = array_append(flags, 'inventory_shortfall') where id = ${order.id}`;
        await notify({ kind: "inventory_shortfall", severity: "critical", title: `Paid order ${orderName(order.number)} is short on stock`,
          body: "Payment arrived after the reservation expired and some items have since sold. Refund or restock.",
          entityType: "order", entityId: order.id }, tx);
      }
      if (order.discount_id) {
        const [r] = await tx`select 1 from discount_redemptions where order_id = ${order.id}`;
        if (!r) {
          await tx`insert into discount_redemptions (discount_id, order_id, customer_id, email, amount_cents)
                   values (${order.discount_id}, ${order.id}, ${order.customer_id}, ${order.email}, ${order.discount_cents})
                   on conflict do nothing`;
          await tx`update discounts set times_used = times_used + 1 where id = ${order.discount_id}`;
        }
      }
    }

    await tx`update orders set payment_status = 'paid', status = 'open', inventory_state = 'committed',
             paid_at = now(), reservation_expires_at = null, cancelled_at = null, cancel_reason = null,
             payment_provider = ${p.provider} where id = ${order.id}`;
    if (order.cart_id) {
      await tx`update carts set status = 'converted', converted_order_id = ${order.id} where id = ${order.cart_id}`;
    }
    await addEvent(tx, order.id, "paid", `Payment verified with ${p.provider}`, { reference, transaction_id: v.transactionId });
    await notify({ kind: "new_order", title: `New order ${orderName(order.number)}`, body: `Paid via ${p.provider}.`,
      entityType: "order", entityId: order.id, dedupeKey: `new-order:${order.id}` }, tx);
    paidOrderId = order.id;
    return "paid";
  });

  if (paidOrderId) {
    try {
      await sendOrderConfirmation(paidOrderId);
    } catch (err) {
      console.error("[orders] confirmation email failed", err);
    }
  }
  return outcome;
}

/* =====================================================================
   CANCELLATION & EXPIRY
   ===================================================================== */

async function cancelPendingInTx(tx: Tx, orderId: string, reason: string, staffId: string | null) {
  const lines = await orderLines(tx, orderId);
  const [o] = await tx<{ inventory_state: string; discount_id: string | null }[]>`
    select inventory_state, discount_id from orders where id = ${orderId}`;
  if (o.inventory_state === "reserved") await releaseReservation(tx, lines, orderId, reason);
  if (o.discount_id) {
    const removed = await tx`delete from discount_redemptions where order_id = ${orderId} returning id`;
    if (removed.length) await tx`update discounts set times_used = greatest(times_used - 1, 0) where id = ${o.discount_id}`;
  }
  await tx`update orders set status = 'cancelled', payment_status = 'voided', inventory_state = 'released',
           cancelled_at = now(), cancel_reason = ${reason}, reservation_expires_at = null where id = ${orderId}`;
  await tx`update payments set status = 'abandoned' where order_id = ${orderId} and status in ('initialized','pending')`;
  await addEvent(tx, orderId, "cancelled", `Order cancelled: ${reason}`, {}, staffId);
}

/**
 * Cancels an order. Unpaid: releases the reservation. Paid & unfulfilled:
 * optionally restocks; money is returned through refundOrder().
 */
export async function cancelOrder(orderId: string, reason: string, opts: { restock: boolean }, staff: StaffUser | null) {
  await transaction(async (tx) => {
    const [o] = await tx<{ status: string; payment_status: string; fulfillment_status: string; inventory_state: string }[]>`
      select status, payment_status, fulfillment_status, inventory_state from orders where id = ${orderId} for update`;
    if (!o) throw new UserFacingError("Order not found.");
    if (o.status === "cancelled") throw new UserFacingError("This order is already cancelled.");
    if (o.payment_status === "pending" || o.payment_status === "failed") {
      await cancelPendingInTx(tx, orderId, reason, staff?.id ?? null);
    } else {
      if (o.fulfillment_status !== "unfulfilled") {
        throw new UserFacingError("Items have already shipped. Use a refund with restock for returns instead.");
      }
      if (opts.restock && o.inventory_state === "committed") {
        const items = await tx<{ id: string; variant_id: string | null; quantity: number; restocked_quantity: number }[]>`
          select id, variant_id, quantity, restocked_quantity from order_items where order_id = ${orderId}`;
        const toRestock = items
          .filter((i) => i.variant_id && i.quantity > i.restocked_quantity)
          .map((i) => ({ variantId: i.variant_id!, quantity: i.quantity - i.restocked_quantity }));
        await restock(tx, toRestock, orderId, staff?.id ?? null, "Order cancelled");
        await tx`update order_items set restocked_quantity = quantity where order_id = ${orderId}`;
      }
      await tx`update orders set status = 'cancelled', cancelled_at = now(), cancel_reason = ${reason} where id = ${orderId}`;
      await addEvent(tx, orderId, "cancelled", `Order cancelled: ${reason}`, { restocked: opts.restock }, staff?.id ?? null);
    }
    await audit(staff, "order.cancel", "order", orderId, { reason, restock: opts.restock }, tx);
  });
}

/**
 * Releases stock held by unpaid orders past their reservation window.
 * Before cancelling, each is re-checked with its provider so a payment that
 * succeeded but whose webhook never arrived is captured, not cancelled.
 */
export async function expireReservations(limit = 50): Promise<{ expired: number; recovered: number }> {
  const due = await db()<{ id: string }[]>`
    select id from orders
    where inventory_state = 'reserved' and payment_status = 'pending' and reservation_expires_at < now()
    order by reservation_expires_at limit ${limit}`;
  let expired = 0;
  let recovered = 0;
  for (const { id } of due) {
    const payments = await db()<{ provider: string; reference: string }[]>`
      select provider, reference from payments where order_id = ${id} and status in ('pending','initialized')`;
    let paid = false;
    for (const p of payments) {
      try {
        const r = await verifyAndApplyPayment(p.provider, p.reference);
        if (r.outcome === "paid" || r.outcome === "already_paid") paid = true;
      } catch {
        // Provider unreachable: leave the order for the next sweep rather than cancel blindly.
        paid = true;
      }
    }
    if (paid) {
      recovered += 1;
      continue;
    }
    await transaction(async (tx) => {
      const [o] = await tx<{ payment_status: string; inventory_state: string }[]>`
        select payment_status, inventory_state from orders where id = ${id} for update`;
      if (o?.payment_status === "pending" && o.inventory_state === "reserved") {
        await cancelPendingInTx(tx, id, "Payment not completed in time", null);
        expired += 1;
      }
    });
  }
  return { expired, recovered };
}

/** Marks carts idle for 1h+ with items and an email as abandoned (feeds Marketing → abandoned carts). */
export async function markAbandonedCarts(): Promise<number> {
  const rows = await db()`
    update carts c set status = 'abandoned'
    where c.status = 'active' and c.updated_at < now() - interval '1 hour'
      and c.email is not null and exists (select 1 from cart_items ci where ci.cart_id = c.id)
    returning c.id`;
  return rows.length;
}

/* =====================================================================
   REFUNDS
   ===================================================================== */

export async function refundOrder(
  orderId: string,
  input: { amountCents: number; reason: string; restockItems: { orderItemId: string; quantity: number }[] },
  staff: StaffUser,
): Promise<{ status: string }> {
  // 1. Validate and record the refund intent atomically.
  const prepared = await transaction(async (tx) => {
    const [o] = await tx<{ total_cents: number; refunded_cents: number; payment_status: string; currency: string }[]>`
      select total_cents, refunded_cents, payment_status, currency from orders where id = ${orderId} for update`;
    if (!o) throw new UserFacingError("Order not found.");
    if (!["paid", "partially_refunded"].includes(o.payment_status)) throw new UserFacingError("Only paid orders can be refunded.");
    const refundable = o.total_cents - o.refunded_cents;
    if (input.amountCents <= 0 || input.amountCents > refundable) {
      throw new UserFacingError(`Refund must be between 0.01 and the ${refundable / 100} still refundable.`);
    }
    const [p] = await tx<{ id: string; provider: string; reference: string; provider_transaction_id: string | null }[]>`
      select id, provider, reference, provider_transaction_id from payments
      where order_id = ${orderId} and status = 'succeeded' order by verified_at desc limit 1`;
    if (!p) throw new UserFacingError("No verified payment found for this order.");

    // Restock validation
    const restockLines: { variantId: string; quantity: number; itemId: string }[] = [];
    for (const r of input.restockItems) {
      if (r.quantity <= 0) continue;
      const [item] = await tx<{ variant_id: string | null; quantity: number; restocked_quantity: number }[]>`
        select variant_id, quantity, restocked_quantity from order_items where id = ${r.orderItemId} and order_id = ${orderId}`;
      if (!item) throw new UserFacingError("Unknown order item.");
      if (r.quantity > item.quantity - item.restocked_quantity) throw new UserFacingError("Can't restock more units than were sold.");
      if (item.variant_id) restockLines.push({ variantId: item.variant_id, quantity: r.quantity, itemId: r.orderItemId });
    }

    const [refund] = await tx<{ id: string }[]>`
      insert into refunds (order_id, payment_id, amount_cents, reason, restock_items, staff_id)
      values (${orderId}, ${p.id}, ${input.amountCents}, ${input.reason},
              ${tx.json(input.restockItems as never)}, ${staff.id}) returning id`;
    return { refundId: refund.id, payment: p, currency: o.currency, restockLines };
  });

  // 2. Ask the provider (outside the transaction — network calls never hold row locks).
  const provider = getProvider(prepared.payment.provider);
  let result: { refundId: string | null; status: "pending" | "succeeded" | "failed"; failureReason: string | null; raw: unknown };
  try {
    if (!provider) throw new Error("Unknown provider");
    result = await provider.refund({
      reference: prepared.payment.reference,
      transactionId: prepared.payment.provider_transaction_id,
      amountCents: input.amountCents,
      currency: prepared.currency,
    });
  } catch (err) {
    result = { refundId: null, status: "failed", failureReason: err instanceof Error ? err.message : "Refund failed", raw: {} };
  }

  // 3. Apply the outcome.
  await transaction(async (tx) => {
    await tx`update refunds set status = ${result.status}, provider_refund_id = ${result.refundId},
             failure_reason = ${result.failureReason}, raw = ${tx.json(result.raw as never)} where id = ${prepared.refundId}`;
    if (result.status === "failed") {
      await addEvent(tx, orderId, "refund_failed", `Refund failed: ${result.failureReason ?? "unknown error"}`, { amount_cents: input.amountCents }, staff.id);
      return;
    }
    await tx`update orders set refunded_cents = refunded_cents + ${input.amountCents},
             payment_status = case when refunded_cents + ${input.amountCents} >= total_cents then 'refunded' else 'partially_refunded' end
             where id = ${orderId}`;
    if (prepared.restockLines.length) {
      await restock(tx, prepared.restockLines, orderId, staff.id, "Refund restock");
      for (const l of prepared.restockLines) {
        await tx`update order_items set restocked_quantity = restocked_quantity + ${l.quantity} where id = ${l.itemId}`;
      }
      const [anyShipped] = await tx`select 1 from order_items where order_id = ${orderId} and fulfilled_quantity > 0`;
      if (anyShipped) await tx`update orders set fulfillment_status = 'returned' where id = ${orderId} and fulfillment_status = 'fulfilled'
                               and not exists (select 1 from order_items where order_id = ${orderId} and restocked_quantity < fulfilled_quantity)`;
    }
    await addEvent(tx, orderId, "refunded", `Refund of ${(input.amountCents / 100).toFixed(2)} ${result.status === "pending" ? "submitted" : "completed"}`,
      { amount_cents: input.amountCents, reason: input.reason, provider_refund_id: result.refundId }, staff.id);
    await audit(staff, "order.refund", "order", orderId, { amount_cents: input.amountCents, status: result.status }, tx);
  });
  return { status: result.status };
}

/** Provider reported a refund outcome asynchronously (webhook). */
export async function applyRefundWebhook(providerRefundId: string, status: "succeeded" | "failed" | "pending") {
  if (status === "pending") return;
  await transaction(async (tx) => {
    const [r] = await tx<{ id: string; order_id: string; status: string; amount_cents: number }[]>`
      select id, order_id, status, amount_cents from refunds where provider_refund_id = ${providerRefundId} for update`;
    if (!r || r.status === status) return;
    await tx`update refunds set status = ${status} where id = ${r.id}`;
    if (status === "failed" && r.status === "pending") {
      // Money did not go back — undo the optimistic refunded total.
      await tx`update orders set refunded_cents = greatest(refunded_cents - ${r.amount_cents}, 0),
               payment_status = case when refunded_cents - ${r.amount_cents} <= 0 then 'paid' else 'partially_refunded' end
               where id = ${r.order_id}`;
      await addEvent(tx, r.order_id, "refund_failed", "Provider reported the refund failed", { refund_id: r.id });
      await notify({ kind: "refund_failed", severity: "critical", title: "A refund failed at the provider", entityType: "order", entityId: r.order_id }, tx);
    } else {
      await addEvent(tx, r.order_id, "refund_completed", "Provider confirmed the refund", { refund_id: r.id });
    }
  });
}

/* =====================================================================
   FULFILMENT
   ===================================================================== */

export async function createShipment(
  orderId: string,
  input: { items: { orderItemId: string; quantity: number }[]; carrier: string; trackingNumber: string; trackingUrl: string | null; notify: boolean },
  staff: StaffUser,
) {
  await transaction(async (tx) => {
    const [o] = await tx<{ payment_status: string; status: string }[]>`
      select payment_status, status from orders where id = ${orderId} for update`;
    if (!o) throw new UserFacingError("Order not found.");
    if (!["paid", "partially_refunded"].includes(o.payment_status)) throw new UserFacingError("Only paid orders can be fulfilled.");
    if (o.status === "cancelled") throw new UserFacingError("This order is cancelled.");
    const items = input.items.filter((i) => i.quantity > 0);
    if (items.length === 0) throw new UserFacingError("Choose at least one item to ship.");
    for (const i of items) {
      const updated = await tx`
        update order_items set fulfilled_quantity = fulfilled_quantity + ${i.quantity}
        where id = ${i.orderItemId} and order_id = ${orderId} and fulfilled_quantity + ${i.quantity} <= quantity returning id`;
      if (!updated.length) throw new UserFacingError("Can't ship more units than were ordered.");
    }
    const [s] = await tx<{ id: string }[]>`
      insert into shipments (order_id, status, carrier, tracking_number, tracking_url, items, shipped_at, staff_id)
      values (${orderId}, 'in_transit', ${input.carrier}, ${input.trackingNumber}, ${input.trackingUrl},
              ${tx.json(items as never)}, now(), ${staff.id}) returning id`;
    const [{ remaining }] = await tx<{ remaining: number }[]>`
      select coalesce(sum(quantity - fulfilled_quantity), 0)::int as remaining from order_items where order_id = ${orderId}`;
    await tx`update orders set fulfillment_status = ${remaining === 0 ? "fulfilled" : "partially_fulfilled"},
             status = case when ${remaining === 0} then 'completed' else status end where id = ${orderId}`;
    await addEvent(tx, orderId, "fulfilled", `Shipment created${input.trackingNumber ? ` — ${input.carrier} ${input.trackingNumber}` : ""}`,
      { shipment_id: s.id, items }, staff.id);
    await audit(staff, "order.fulfill", "order", orderId, { shipment_id: s.id }, tx);
  });
}

export async function updateShipment(
  shipmentId: string,
  input: { status: string; carrier: string; trackingNumber: string; trackingUrl: string | null },
  staff: StaffUser,
) {
  await transaction(async (tx) => {
    const [s] = await tx<{ order_id: string }[]>`
      update shipments set status = ${input.status}, carrier = ${input.carrier}, tracking_number = ${input.trackingNumber},
        tracking_url = ${input.trackingUrl},
        delivered_at = case when ${input.status} = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
      where id = ${shipmentId} returning order_id`;
    if (!s) throw new UserFacingError("Shipment not found.");
    await addEvent(tx, s.order_id, "shipment_updated", `Shipment ${input.status.replace(/_/g, " ")}`, { shipment_id: shipmentId }, staff.id);
    await audit(staff, "shipment.update", "shipment", shipmentId, input, tx);
  });
}
