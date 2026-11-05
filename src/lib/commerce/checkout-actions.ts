"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/auth/customer";
import { readCartId, loadCart } from "@/lib/commerce/cart";
import { createOrderFromCart, initializePayment, type Address } from "@/lib/commerce/orders";
import { computeTotals } from "@/lib/commerce/pricing";
import { getStoreSettings } from "@/lib/commerce/settings";
import { availableProviders } from "@/lib/payments";
import type { ProviderId } from "@/lib/payments/types";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/security/request";
import {
  bool,
  country,
  email as emailField,
  optStr,
  optUuid,
  str,
  toActionError,
  UserFacingError,
  type ActionState,
} from "@/lib/security/validate";

export interface Quote {
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  discountTitle: string | null;
  discountError: string | null;
  shippingOptions: { id: string; name: string; priceCents: number; days: string | null }[];
  shippingRateId: string | null;
  shippingError: string | null;
}

/** Live totals for the checkout form. Pure read — creates nothing. */
export async function quoteAction(input: {
  country: string;
  shippingRateId: string | null;
  discountCode: string;
  email: string;
}): Promise<Quote | null> {
  if (!(await rateLimit(`quote:${await clientIp()}`, 120, 60)).ok) return null;
  const cartId = await readCartId();
  if (!cartId) return null;
  const cart = await loadCart(cartId);
  if (!cart || cart.items.length === 0) return null;
  const settings = await getStoreSettings();
  const t = await computeTotals({
    lines: cart.items.map((i) => ({ variantId: i.variantId, productId: i.productId, quantity: i.quantity, unitPriceCents: i.unitPriceCents })),
    discountCode: input.discountCode.trim().slice(0, 64) || null,
    email: /^[^\s@]+@[^\s@]+$/.test(input.email) ? input.email.toLowerCase() : null,
    country: /^[A-Z]{2}$/.test(input.country) ? input.country : null,
    shippingRateId: input.shippingRateId && /^[0-9a-f-]{36}$/i.test(input.shippingRateId) ? input.shippingRateId : null,
    settings,
  });
  return {
    subtotalCents: t.subtotalCents,
    discountCents: t.discountCents,
    shippingCents: t.shippingCents,
    taxCents: t.taxCents,
    totalCents: t.totalCents,
    currency: settings.currency,
    discountTitle: t.discount?.title ?? null,
    discountError: t.discountError,
    shippingOptions: t.shippingOptions.map((o) => ({
      id: o.id,
      name: o.name,
      priceCents: o.priceCents,
      days: o.daysMin !== null && o.daysMax !== null ? `${o.daysMin}–${o.daysMax} days` : null,
    })),
    shippingRateId: t.shippingRate?.id ?? null,
    shippingError: t.shippingError,
  };
}

async function origin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export async function placeOrderAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let paymentUrl: string;
  try {
    if (!(await rateLimit(`checkout:${await clientIp()}`, 10, 600)).ok) {
      throw new UserFacingError("Too many checkout attempts. Wait a few minutes and try again.");
    }
    const cartId = await readCartId();
    if (!cartId) throw new UserFacingError("Your bag is empty.");

    const email = emailField(form, "email");
    const phone = optStr(form, "phone", { max: 30, pattern: /^[+0-9 ()-]{6,30}$/, label: "Phone" });
    const address: Address = {
      firstName: str(form, "firstName", { max: 80, label: "First name" }),
      lastName: str(form, "lastName", { max: 80, label: "Last name" }),
      company: optStr(form, "company", { max: 120 }),
      line1: str(form, "line1", { max: 200, label: "Address" }),
      line2: optStr(form, "line2", { max: 200 }),
      city: str(form, "city", { max: 120, label: "City" }),
      region: optStr(form, "region", { max: 120 }),
      postalCode: optStr(form, "postalCode", { max: 20 }),
      country: country(form, "country"),
      phone,
    };
    const provider = str(form, "provider", { max: 20, label: "Payment method" }) as ProviderId;
    const settings = await getStoreSettings();
    const providers = await availableProviders(settings.currency);
    if (!providers.some((p) => p.id === provider)) throw new UserFacingError("Choose an available payment method.");

    const customer = await getCustomer();
    const order = await createOrderFromCart({
      cartId,
      customerId: customer?.id ?? null,
      email: customer?.email ?? email,
      phone,
      acceptsMarketing: bool(form, "acceptsMarketing"),
      shippingAddress: address,
      shippingRateId: optUuid(form, "shippingRateId"),
      discountCode: optStr(form, "discountCode", { max: 64 }) || null,
      provider,
      customerNote: optStr(form, "note", { max: 1000 }),
    });

    if (customer && bool(form, "saveAddress")) {
      await db()`
        insert into customer_addresses (customer_id, first_name, last_name, company, line1, line2, city, region, postal_code, country, phone, is_default)
        select ${customer.id}, ${address.firstName}, ${address.lastName}, ${address.company ?? ""}, ${address.line1}, ${address.line2 ?? ""},
               ${address.city}, ${address.region ?? ""}, ${address.postalCode ?? ""}, ${address.country}, ${phone},
               not exists (select 1 from customer_addresses where customer_id = ${customer.id} and is_default)`;
    }

    const base = await origin();
    paymentUrl = await initializePayment(order, {
      provider,
      email: customer?.email ?? email,
      name: `${address.firstName} ${address.lastName}`,
      phone,
      callbackUrl: `${base}/checkout/return?order=${order.orderId}&key=${encodeURIComponent(order.accessToken)}`,
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect(paymentUrl);
}
