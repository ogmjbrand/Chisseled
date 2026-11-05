"use server";

import { adminAction } from "@/lib/admin/action";
import { db, pgCode } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { sendEmail } from "@/lib/commerce/email";
import {
  UserFacingError,
  ValidationError,
  bool,
  oneOf,
  optInt,
  optMoney,
  optStr,
  optUuid,
  str,
  uuid,
} from "@/lib/security/validate";

function optDate(form: FormData, name: string): Date | null {
  const v = optStr(form, name, { max: 30 });
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new ValidationError(name, "Enter a valid date.");
  return d;
}

/* ------------------------------- Discounts ------------------------------- */

export const saveDiscountAction = adminAction("discounts:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const isAutomatic = bool(form, "is_automatic");
  const code = isAutomatic ? null : str(form, "code", { max: 40, pattern: /^[A-Za-z0-9_-]+$/, label: "Code" }).toUpperCase();
  const kind = oneOf(form, "kind", ["percentage", "fixed_amount", "free_shipping"] as const);
  let value = 0;
  if (kind === "percentage") {
    value = optInt(form, "percent", { min: 1, max: 100, label: "Percentage" }) ?? 0;
    if (!value) throw new ValidationError("percent", "Enter a percentage between 1 and 100.");
  } else if (kind === "fixed_amount") {
    value = optMoney(form, "amount", "Amount") ?? 0;
    if (!value) throw new ValidationError("amount", "Enter the amount off.");
  }
  const appliesTo = oneOf(form, "applies_to", ["all", "collections", "products"] as const, "all");
  const collectionIds = form.getAll("collection_ids").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const productIds = form.getAll("product_ids").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  if (appliesTo === "collections" && !collectionIds.length) throw new ValidationError("collection_ids", "Choose at least one collection.");
  if (appliesTo === "products" && !productIds.length) throw new ValidationError("product_ids", "Choose at least one product.");
  const startsAt = optDate(form, "starts_at") ?? new Date();
  const endsAt = optDate(form, "ends_at");
  if (endsAt && endsAt <= startsAt) throw new ValidationError("ends_at", "End date must be after the start date.");
  const data = {
    code,
    title: str(form, "title", { max: 120, label: "Title" }),
    kind,
    value,
    min_subtotal_cents: optMoney(form, "min_subtotal", "Minimum spend") ?? 0,
    applies_to: appliesTo,
    collection_ids: appliesTo === "collections" ? collectionIds : [],
    product_ids: appliesTo === "products" ? productIds : [],
    usage_limit: optInt(form, "usage_limit", { min: 1, max: 10_000_000, label: "Usage limit" }),
    once_per_customer: bool(form, "once_per_customer"),
    is_automatic: isAutomatic,
    status: oneOf(form, "status", ["active", "disabled"] as const, "active"),
    starts_at: startsAt,
    ends_at: endsAt,
  };
  const sql = db();
  const onDup = (err: unknown): never => {
    if (pgCode(err) === "23505") throw new ValidationError("code", "That code already exists.");
    throw err;
  };
  if (id) {
    await sql`update discounts set ${sql(data)} where id = ${id}`.catch(onDup);
    await audit(staff, "discount.update", "discount", id, { code, status: data.status });
    return "Discount saved.";
  }
  const [row] = await sql<{ id: string }[]>`insert into discounts ${sql(data)} returning id`.catch(onDup);
  await audit(staff, "discount.create", "discount", row.id, { code, kind, value });
  return "Discount created.";
});

export const deleteDiscountAction = adminAction("discounts:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [{ used }] = await db()<{ used: number }[]>`select count(*)::int as used from discount_redemptions where discount_id = ${id}`;
  if (used > 0) {
    await db()`update discounts set status = 'disabled' where id = ${id}`;
    await audit(staff, "discount.disable", "discount", id, {});
    return "This discount has been used, so it was disabled instead of deleted (order history keeps it).";
  }
  await db()`delete from discounts where id = ${id}`;
  await audit(staff, "discount.delete", "discount", id, {});
  return "Discount deleted.";
});

/* -------------------------------- Shipping -------------------------------- */

function countries(form: FormData): string[] {
  return [...new Set(form.getAll("countries").map((c) => String(c).toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))];
}

export const saveZoneAction = adminAction("shipping:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const name = str(form, "name", { max: 80, label: "Zone name" });
  const rest = bool(form, "is_rest_of_world");
  const list = rest ? [] : countries(form);
  if (!rest && !list.length) throw new ValidationError("countries", "Choose at least one country, or make this the rest-of-world zone.");
  const sql = db();
  const clash = await sql<{ name: string; c: string }[]>`
    select z.name, c from shipping_zones z, unnest(z.countries) c where c = any(${list}::char(2)[]) and z.id <> ${id ?? "00000000-0000-0000-0000-000000000000"}`;
  if (clash.length) throw new UserFacingError(`${clash[0].c.trim()} is already in “${clash[0].name}”. A country can only be in one zone.`);
  const onDup = (err: unknown): never => {
    if (pgCode(err) === "23505") throw new UserFacingError("There can only be one rest-of-world zone.");
    throw err;
  };
  if (id) {
    await sql`update shipping_zones set name = ${name}, countries = ${list}::char(2)[], is_rest_of_world = ${rest} where id = ${id}`.catch(onDup);
    await audit(staff, "shipping.zone_update", "shipping_zone", id, { name, countries: list });
    return "Zone saved.";
  }
  const [row] = await sql<{ id: string }[]>`insert into shipping_zones (name, countries, is_rest_of_world) values (${name}, ${list}::char(2)[], ${rest}) returning id`.catch(onDup);
  await audit(staff, "shipping.zone_create", "shipping_zone", row.id, { name, countries: list });
  return "Zone created — now add a delivery rate to it.";
});

export const deleteZoneAction = adminAction("shipping:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`delete from shipping_zones where id = ${id}`;
  await audit(staff, "shipping.zone_delete", "shipping_zone", id, {});
  return "Zone deleted.";
});

export const saveRateAction = adminAction("shipping:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const price = optMoney(form, "price", "Price");
  if (price === null) throw new ValidationError("price", "Enter a price (0 for free).");
  const data = {
    zone_id: uuid(form, "zone_id"),
    name: str(form, "name", { max: 80, label: "Rate name" }),
    price_cents: price,
    free_over_cents: optMoney(form, "free_over", "Free over"),
    min_subtotal_cents: optMoney(form, "min_subtotal", "Minimum order") ?? 0,
    days_min: optInt(form, "days_min", { min: 0, max: 365 }),
    days_max: optInt(form, "days_max", { min: 0, max: 365 }),
    active: bool(form, "active"),
    position: optInt(form, "position", { min: 0, max: 1000 }) ?? 0,
  };
  if (data.days_min !== null && data.days_max !== null && data.days_max < data.days_min) throw new ValidationError("days_max", "Max days must be at least min days.");
  const sql = db();
  if (id) {
    await sql`update shipping_rates set ${sql(data)} where id = ${id}`;
    await audit(staff, "shipping.rate_update", "shipping_rate", id, data);
    return "Rate saved.";
  }
  const [row] = await sql<{ id: string }[]>`insert into shipping_rates ${sql(data)} returning id`;
  await audit(staff, "shipping.rate_create", "shipping_rate", row.id, data);
  return "Rate added.";
});

export const deleteRateAction = adminAction("shipping:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`delete from shipping_rates where id = ${id}`;
  await audit(staff, "shipping.rate_delete", "shipping_rate", id, {});
  return "Rate deleted.";
});

/* -------------------------------- Marketing -------------------------------- */

export const saveCampaignAction = adminAction("marketing:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const data = {
    name: str(form, "name", { max: 120, label: "Name" }),
    channel: oneOf(form, "channel", ["email", "sms", "social", "other"] as const, "email"),
    status: oneOf(form, "status", ["draft", "scheduled", "active", "completed"] as const, "draft"),
    segment: oneOf(form, "segment", ["all", "buyers", "repeat", "vip", "at_risk", "prospects", "subscribers"] as const, "subscribers"),
    discount_id: optUuid(form, "discount_id"),
    starts_at: optDate(form, "starts_at"),
    ends_at: optDate(form, "ends_at"),
    notes: optStr(form, "notes", { max: 4000 }),
  };
  const sql = db();
  if (id) {
    await sql`update marketing_campaigns set ${sql(data)} where id = ${id}`;
    await audit(staff, "campaign.update", "campaign", id, { status: data.status });
    return "Campaign saved.";
  }
  const [row] = await sql<{ id: string }[]>`insert into marketing_campaigns ${sql(data)} returning id`;
  await audit(staff, "campaign.create", "campaign", row.id, { name: data.name });
  return "Campaign created.";
});

export const deleteCampaignAction = adminAction("marketing:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`delete from marketing_campaigns where id = ${id}`;
  await audit(staff, "campaign.delete", "campaign", id, {});
  return "Campaign deleted.";
});

/** Sends one recovery email for an abandoned cart (requires the email provider). */
export const remindCartAction = adminAction("marketing:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [cart] = await db()<{ email: string | null; reminder_sent_at: Date | null }[]>`select email, reminder_sent_at from carts where id = ${id}`;
  if (!cart?.email) throw new UserFacingError("This cart has no email address.");
  if (cart.reminder_sent_at) throw new UserFacingError("A reminder was already sent for this cart.");
  const [c] = await db()<{ accepts_marketing: boolean }[]>`select accepts_marketing from customers where email = ${cart.email}`;
  if (!c?.accepts_marketing) throw new UserFacingError("This shopper hasn't opted in to marketing email.");
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const sent = await sendEmail(
    cart.email,
    "You left something in your bag",
    `<div style="font-family:system-ui,sans-serif"><p>Your CHISSELED bag is still waiting.</p><p><a href="${base}/shop">Return to the store</a></p></div>`,
  );
  if (!sent) throw new UserFacingError("Email isn't configured (RESEND_API_KEY / EMAIL_FROM).");
  await db()`update carts set reminder_sent_at = now() where id = ${id}`;
  await audit(staff, "cart.reminder", "cart", id, {});
  return "Reminder sent.";
});
