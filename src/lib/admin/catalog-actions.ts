"use server";

import { adminAction } from "@/lib/admin/action";
import { db, pgCode } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { SLUG_RE, ValidationError, oneOf, optInt, optStr, optUuid, slugify, str, uuid, UserFacingError } from "@/lib/security/validate";

function slugFrom(form: FormData, fallbackFrom: string): string {
  const slug = (optStr(form, "slug", { max: 96 }) || slugify(fallbackFrom)).toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError("slug", "Handle may contain lowercase letters, numbers and hyphens.");
  return slug;
}

function dup(err: unknown): never {
  if (pgCode(err) === "23505") throw new ValidationError("slug", "That handle is already in use.");
  throw err;
}

export const saveCollectionAction = adminAction("products:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const title = str(form, "title", { max: 120, label: "Title" });
  const slug = slugFrom(form, title);
  const description = optStr(form, "description", { max: 2000 });
  const status = oneOf(form, "status", ["draft", "active", "archived"] as const, "active");
  const position = optInt(form, "position", { min: 0, max: 10_000 }) ?? 0;
  const image = optStr(form, "image_url", { max: 1000, pattern: /^(https:\/\/|\/)/ }) || null;
  const seoTitle = optStr(form, "seo_title", { max: 70 }) || null;
  const seoDescription = optStr(form, "seo_description", { max: 320 }) || null;
  if (id) {
    await db()`update collections set title = ${title}, slug = ${slug}, description = ${description}, status = ${status},
               position = ${position}, image_url = ${image}, seo_title = ${seoTitle}, seo_description = ${seoDescription}
               where id = ${id}`.catch(dup);
    await audit(staff, "collection.update", "collection", id, { title, status });
    return "Collection saved.";
  }
  const [row] = await db()<{ id: string }[]>`
    insert into collections (title, slug, description, status, position, image_url, seo_title, seo_description)
    values (${title}, ${slug}, ${description}, ${status}, ${position}, ${image}, ${seoTitle}, ${seoDescription}) returning id`.catch(dup);
  await audit(staff, "collection.create", "collection", row.id, { title });
  return "Collection created.";
});

export const deleteCollectionAction = adminAction("products:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [row] = await db()<{ title: string }[]>`delete from collections where id = ${id} returning title`;
  await audit(staff, "collection.delete", "collection", id, { title: row?.title });
  return "Collection deleted. Its products were not affected.";
});

export const setCollectionProductsAction = adminAction("products:write", async (staff, form) => {
  const id = uuid(form, "id");
  const add = optUuid(form, "add_product");
  const remove = optUuid(form, "remove_product");
  if (add) {
    await db()`insert into product_collections (product_id, collection_id, position)
               values (${add}, ${id}, (select coalesce(max(position)+1,0) from product_collections where collection_id = ${id}))
               on conflict do nothing`;
  }
  if (remove) await db()`delete from product_collections where collection_id = ${id} and product_id = ${remove}`;
  await audit(staff, "collection.products", "collection", id, { add, remove });
  return add ? "Product added to collection." : "Product removed from collection.";
});

export const saveCategoryAction = adminAction("products:write", async (staff, form) => {
  const id = optUuid(form, "id");
  const name = str(form, "name", { max: 80, label: "Name" });
  const slug = slugFrom(form, name);
  const parent = optUuid(form, "parent_id");
  if (parent && parent === id) throw new UserFacingError("A category can't be its own parent.");
  const description = optStr(form, "description", { max: 1000 });
  const position = optInt(form, "position", { min: 0, max: 10_000 }) ?? 0;
  if (id) {
    await db()`update categories set name = ${name}, slug = ${slug}, parent_id = ${parent}, description = ${description}, position = ${position}
               where id = ${id}`.catch(dup);
    await audit(staff, "category.update", "category", id, { name });
    return "Category saved.";
  }
  const [row] = await db()<{ id: string }[]>`
    insert into categories (name, slug, parent_id, description, position) values (${name}, ${slug}, ${parent}, ${description}, ${position})
    returning id`.catch(dup);
  await audit(staff, "category.create", "category", row.id, { name });
  return "Category created.";
});

export const deleteCategoryAction = adminAction("products:write", async (staff, form) => {
  const id = uuid(form, "id");
  const [row] = await db()<{ name: string }[]>`delete from categories where id = ${id} returning name`;
  await audit(staff, "category.delete", "category", id, { name: row?.name });
  return "Category deleted. Products in it are now uncategorised.";
});
