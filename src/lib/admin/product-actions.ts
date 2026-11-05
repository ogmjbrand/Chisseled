"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin/action";
import { db, pgCode, transaction, type Tx } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { adjust } from "@/lib/commerce/inventory";
import { uploadImage } from "@/lib/admin/storage";
import { readSetting, DEFAULT_STORE, type StoreSettings } from "@/lib/commerce/settings";
import { requirePermission } from "@/lib/auth/staff";
import {
  SLUG_RE,
  UserFacingError,
  ValidationError,
  bool,
  list,
  oneOf,
  optInt,
  optMoney,
  optStr,
  optUuid,
  slugify,
  str,
  toActionError,
  uuid,
  type ActionState,
} from "@/lib/security/validate";

const STATUSES = ["draft", "active", "archived"] as const;
const GENDERS = ["unisex", "women", "men"] as const;

interface OptionDef {
  name: string;
  values: string[];
}

/** "Size: S, M, L" per line → [{ name: "Size", values: [...] }] */
function parseOptions(text: string): OptionDef[] {
  const out: OptionDef[] = [];
  for (const line of text.split("\n")) {
    const [rawName, ...rest] = line.split(":");
    const name = rawName?.trim();
    if (!name || rest.length === 0) continue;
    const values = [...new Set(rest.join(":").split(",").map((v) => v.trim()).filter(Boolean))];
    if (!values.length) continue;
    if (name.length > 40 || values.some((v) => v.length > 60)) throw new ValidationError("options", "Option names and values must be short.");
    if (out.some((o) => o.name.toLowerCase() === name.toLowerCase())) throw new ValidationError("options", `Option “${name}” is listed twice.`);
    out.push({ name, values: values.slice(0, 50) });
  }
  if (out.length > 3) throw new ValidationError("options", "Use at most three options (e.g. Size, Color, Material).");
  return out;
}

function combinations(options: OptionDef[]): Record<string, string>[] {
  if (options.length === 0) return [{}];
  return options.reduce<Record<string, string>[]>(
    (acc, opt) => acc.flatMap((combo) => opt.values.map((v) => ({ ...combo, [opt.name]: v }))),
    [{}],
  );
}

function variantTitle(options: Record<string, string>): string {
  const values = Object.values(options);
  return values.length ? values.join(" / ") : "Default";
}

/** "Title: detail" per line → benefits[] */
function parseBenefits(text: string) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((l) => {
      const i = l.indexOf(":");
      return i > 0 ? { title: l.slice(0, i).trim(), detail: l.slice(i + 1).trim() } : { title: l, detail: "" };
    });
}

function readCore(form: FormData) {
  const title = str(form, "title", { max: 200, label: "Title" });
  const slug = (optStr(form, "slug", { max: 96 }) || slugify(title)).toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError("slug", "URL handle may contain lowercase letters, numbers and hyphens.");
  return {
    title,
    slug,
    subtitle: optStr(form, "subtitle", { max: 200 }),
    description: optStr(form, "description", { max: 20000 }),
    status: oneOf(form, "status", STATUSES, "draft"),
    category_id: optUuid(form, "category_id"),
    product_type: optStr(form, "product_type", { max: 80 }),
    vendor: optStr(form, "vendor", { max: 80 }) || "CHISSELED",
    gender: oneOf(form, "gender", GENDERS, "unisex"),
    tags: list(form, "tags", 30).map((t) => t.slice(0, 40)),
    featured: bool(form, "featured"),
    seo_title: optStr(form, "seo_title", { max: 70 }) || null,
    seo_description: optStr(form, "seo_description", { max: 320 }) || null,
    details: {
      story: optStr(form, "story", { max: 10000 }),
      fabric: optStr(form, "fabric", { max: 1000 }),
      care: optStr(form, "care", { max: 1000 }),
      modelNote: optStr(form, "modelNote", { max: 300 }),
      fit: optStr(form, "fit", { max: 20 }),
      benefits: parseBenefits(optStr(form, "benefits", { max: 5000 })),
      badges: list(form, "badges", 4),
    },
    collections: form.getAll("collections").map(String).filter((id) => /^[0-9a-f-]{36}$/i.test(id)),
  };
}

async function setCollections(tx: Tx, productId: string, ids: string[]) {
  await tx`delete from product_collections where product_id = ${productId} and not (collection_id = any(${ids}::uuid[]))`;
  for (const id of ids) {
    await tx`insert into product_collections (product_id, collection_id) values (${productId}, ${id}) on conflict do nothing`;
  }
}

function slugTaken(err: unknown): never {
  if (pgCode(err) === "23505") throw new ValidationError("slug", "Another product already uses that URL handle (or SKU).");
  throw err;
}

/* -------------------------------------------------------------------------- */

export async function createProductAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  let id: string;
  try {
    const staff = await requirePermission("products:write");
    const core = readCore(form);
    const options = parseOptions(optStr(form, "options", { max: 3000 }));
    const price = optMoney(form, "price", "Price");
    if (price === null) throw new ValidationError("price", "Price is required.");
    const compareAt = optMoney(form, "compare_at", "Compare-at price");
    const cost = optMoney(form, "cost", "Cost");
    const stock = optInt(form, "stock", { min: 0, max: 1_000_000, label: "Starting stock" }) ?? 0;
    const skuBase = optStr(form, "sku", { max: 60 });
    const combos = combinations(options);
    if (combos.length > 100) throw new ValidationError("options", "That makes more than 100 variants — split it into separate products.");

    id = await transaction(async (tx) => {
      const settings = await readSetting<StoreSettings>("store", DEFAULT_STORE, tx);
      const [p] = await tx<{ id: string }[]>`
        insert into products (slug, title, subtitle, description, status, category_id, product_type, vendor, gender, tags,
                              options, details, seo_title, seo_description, featured, published_at)
        values (${core.slug}, ${core.title}, ${core.subtitle}, ${core.description}, ${core.status}, ${core.category_id},
                ${core.product_type}, ${core.vendor}, ${core.gender}, ${core.tags}, ${tx.json(options as never)},
                ${tx.json(core.details as never)}, ${core.seo_title}, ${core.seo_description}, ${core.featured},
                ${core.status === "active" ? new Date() : null})
        returning id`.catch(slugTaken);
      await setCollections(tx, p.id, core.collections);
      let pos = 0;
      for (const combo of combos) {
        const suffix = Object.values(combo).map((v) => slugify(v).toUpperCase()).join("-");
        const sku = skuBase ? (suffix ? `${skuBase}-${suffix}` : skuBase) : null;
        const [v] = await tx<{ id: string }[]>`
          insert into product_variants (product_id, title, sku, price_cents, compare_at_cents, cost_cents, options, position)
          values (${p.id}, ${variantTitle(combo)}, ${sku}, ${price}, ${compareAt}, ${cost}, ${tx.json(combo as never)}, ${pos++})
          returning id`.catch(slugTaken);
        await tx`insert into inventory (variant_id, low_stock_threshold) values (${v.id}, ${settings.low_stock_default})`;
        if (stock > 0) await adjust(tx, { variantId: v.id, mode: "set", quantity: stock, reason: "restock", note: "Initial stock", staffId: staff.id });
      }
      await audit(staff, "product.create", "product", p.id, { title: core.title, variants: combos.length }, tx);
      return p.id;
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${id}?created=1`);
}

export const updateProductAction = adminAction("products:write", async (staff, form) => {
  const id = uuid(form, "id");
  const core = readCore(form);
  const options = parseOptions(optStr(form, "options", { max: 3000 }));
  await transaction(async (tx) => {
    const [before] = await tx<{ status: string; published_at: Date | null }[]>`select status, published_at from products where id = ${id} for update`;
    if (!before) throw new UserFacingError("Product not found.");
    if (core.status === "active") {
      const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from product_variants where product_id = ${id}`;
      if (n === 0) throw new UserFacingError("Add at least one variant before making this product active.");
    }
    await tx`
      update products set slug = ${core.slug}, title = ${core.title}, subtitle = ${core.subtitle}, description = ${core.description},
        status = ${core.status}, category_id = ${core.category_id}, product_type = ${core.product_type}, vendor = ${core.vendor},
        gender = ${core.gender}, tags = ${core.tags}, options = ${tx.json(options as never)}, details = ${tx.json(core.details as never)},
        seo_title = ${core.seo_title}, seo_description = ${core.seo_description}, featured = ${core.featured},
        published_at = case when ${core.status} = 'active' then coalesce(published_at, now()) else published_at end
      where id = ${id}`.catch(slugTaken);
    await setCollections(tx, id, core.collections);
    await audit(staff, "product.update", "product", id, { title: core.title, status: { from: before.status, to: core.status } }, tx);
  });
  return "Product saved.";
});

/** Creates any option combinations that don't have a variant yet. */
export const generateVariantsAction = adminAction("products:write", async (staff, form) => {
  const id = uuid(form, "id");
  const price = optMoney(form, "price", "Price");
  return transaction(async (tx) => {
    const [p] = await tx<{ options: OptionDef[] }[]>`select options from products where id = ${id} for update`;
    if (!p) throw new UserFacingError("Product not found.");
    const existing = await tx<{ options: Record<string, string>; price_cents: number }[]>`
      select options, price_cents from product_variants where product_id = ${id}`;
    const key = (o: Record<string, string>) => JSON.stringify(Object.entries(o).sort());
    const have = new Set(existing.map((e) => key(e.options)));
    const fallback = price ?? existing[0]?.price_cents;
    if (fallback === undefined) throw new ValidationError("price", "Enter a price for the new variants.");
    const missing = combinations(p.options).filter((c) => !have.has(key(c)));
    if (missing.length + existing.length > 100) throw new UserFacingError("That would exceed 100 variants.");
    let pos = existing.length;
    for (const combo of missing) {
      const [v] = await tx<{ id: string }[]>`
        insert into product_variants (product_id, title, price_cents, options, position)
        values (${id}, ${variantTitle(combo)}, ${fallback}, ${tx.json(combo as never)}, ${pos++}) returning id`;
      await tx`insert into inventory (variant_id) values (${v.id})`;
    }
    await audit(staff, "product.variants_generate", "product", id, { created: missing.length }, tx);
    return missing.length ? `${missing.length} variant${missing.length === 1 ? "" : "s"} created.` : "Every combination already has a variant.";
  });
});

/** Saves every variant row of the editor in one transaction. Field names: v.<variantId>.<field> */
export const saveVariantsAction = adminAction("products:write", async (staff, form) => {
  const productId = uuid(form, "id");
  const ids = form.getAll("variant_ids").map(String);
  await transaction(async (tx) => {
    for (const vid of ids) {
      if (!/^[0-9a-f-]{36}$/i.test(vid)) continue;
      const f = (name: string) => `v.${vid}.${name}`;
      const price = optMoney(form, f("price"), "Price");
      if (price === null) throw new ValidationError(f("price"), "Every variant needs a price.");
      const compareAt = optMoney(form, f("compare_at"), "Compare-at price");
      if (compareAt !== null && compareAt <= price) throw new ValidationError(f("compare_at"), "Compare-at price must be higher than the price (it's the “was” price).");
      const sku = optStr(form, f("sku"), { max: 60 }) || null;
      await tx`
        update product_variants set
          sku = ${sku}, barcode = ${optStr(form, f("barcode"), { max: 60 }) || null}, price_cents = ${price},
          compare_at_cents = ${compareAt}, cost_cents = ${optMoney(form, f("cost"), "Cost")},
          weight_grams = ${optInt(form, f("weight"), { min: 0, max: 1_000_000, label: "Weight" })},
          track_inventory = ${bool(form, f("track"))}, image_url = ${optStr(form, f("image_url"), { max: 500, pattern: /^(https:\/\/|\/)/ }) || null},
          position = ${optInt(form, f("position"), { min: 0, max: 1000 }) ?? 0}
        where id = ${vid} and product_id = ${productId}`.catch(slugTaken);
      const onHand = optInt(form, f("on_hand"), { min: 0, max: 1_000_000, label: "On hand" });
      const threshold = optInt(form, f("threshold"), { min: 0, max: 100_000, label: "Low-stock threshold" });
      if (onHand !== null) {
        await adjust(tx, { variantId: vid, mode: "set", quantity: onHand, reason: "adjustment", note: "Edited on product page", staffId: staff.id, lowStockThreshold: threshold });
      }
    }
    await audit(staff, "product.variants_update", "product", productId, { variants: ids.length }, tx);
  });
  return "Variants saved.";
});

export const deleteVariantAction = adminAction("products:write", async (staff, form) => {
  const productId = uuid(form, "id");
  const vid = uuid(form, "variant_id");
  const [{ sold }] = await db()<{ sold: number }[]>`select count(*)::int as sold from order_items where variant_id = ${vid}`;
  const [{ reserved }] = await db()<{ reserved: number }[]>`select coalesce(max(reserved),0)::int as reserved from inventory where variant_id = ${vid}`;
  if (reserved > 0) throw new UserFacingError("This variant has stock reserved by unpaid orders. Try again later.");
  await db()`delete from product_variants where id = ${vid} and product_id = ${productId}`;
  await audit(staff, "product.variant_delete", "product", productId, { variant_id: vid, had_sales: sold > 0 });
  return sold > 0 ? "Variant removed. Past orders keep their line details." : "Variant removed.";
});

export const addImageAction = adminAction("products:write", async (staff, form) => {
  const productId = uuid(form, "id");
  const alt = optStr(form, "alt", { max: 200 });
  const file = form.get("file");
  let url = optStr(form, "url", { max: 1000 });
  if (file instanceof File && file.size > 0) {
    url = await uploadImage(file, `products/${productId}`);
  }
  if (!url) throw new ValidationError("url", "Choose a file or paste an image URL.");
  if (!/^(https:\/\/|\/)/.test(url)) throw new ValidationError("url", "Image URLs must start with https:// or /.");
  await db()`
    insert into product_images (product_id, url, alt, position)
    values (${productId}, ${url}, ${alt}, (select coalesce(max(position) + 1, 0) from product_images where product_id = ${productId}))`;
  await audit(staff, "product.image_add", "product", productId, { url });
  return "Image added.";
});

export const updateImagesAction = adminAction("products:write", async (staff, form) => {
  const productId = uuid(form, "id");
  const ids = form.getAll("image_ids").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  await transaction(async (tx) => {
    for (const iid of ids) {
      await tx`update product_images set alt = ${optStr(form, `img.${iid}.alt`, { max: 200 })},
               position = ${optInt(form, `img.${iid}.position`, { min: 0, max: 1000 }) ?? 0}
               where id = ${iid} and product_id = ${productId}`;
    }
    await audit(staff, "product.images_update", "product", productId, {}, tx);
  });
  return "Images updated.";
});

export const deleteImageAction = adminAction("products:write", async (staff, form) => {
  const productId = uuid(form, "id");
  const imageId = uuid(form, "image_id");
  await db()`delete from product_images where id = ${imageId} and product_id = ${productId}`;
  await audit(staff, "product.image_delete", "product", productId, { image_id: imageId });
  return "Image removed.";
});

export async function deleteProductAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const staff = await requirePermission("products:write");
    const id = uuid(form, "id");
    const [{ sold }] = await db()<{ sold: number }[]>`select count(*)::int as sold from order_items where product_id = ${id}`;
    if (sold > 0) throw new UserFacingError("This product has been ordered before. Archive it instead so order history stays intact.");
    const [{ reserved }] = await db()<{ reserved: number }[]>`
      select coalesce(sum(i.reserved),0)::int as reserved from inventory i join product_variants v on v.id = i.variant_id where v.product_id = ${id}`;
    if (reserved > 0) throw new UserFacingError("Stock is reserved by unpaid orders.");
    const [p] = await db()<{ title: string }[]>`delete from products where id = ${id} returning title`;
    await audit(staff, "product.delete", "product", id, { title: p?.title });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

export const bulkStatusAction = adminAction("products:write", async (staff, form) => {
  const ids = form.getAll("ids").map(String).filter((x) => /^[0-9a-f-]{36}$/i.test(x));
  const status = oneOf(form, "bulk_status", STATUSES);
  if (!ids.length) throw new UserFacingError("Select at least one product.");
  if (status === "active") {
    const [{ n }] = await db()<{ n: number }[]>`
      select count(*)::int as n from products p where p.id = any(${ids}::uuid[])
      and not exists (select 1 from product_variants v where v.product_id = p.id)`;
    if (n) throw new UserFacingError(`${n} selected product${n === 1 ? " has" : "s have"} no variants and can't be activated.`);
  }
  await db()`update products set status = ${status},
             published_at = case when ${status} = 'active' then coalesce(published_at, now()) else published_at end
             where id = any(${ids}::uuid[])`;
  await audit(staff, "product.bulk_status", "product", ids.join(","), { status, count: ids.length });
  return `${ids.length} product${ids.length === 1 ? "" : "s"} set to ${status}.`;
});
