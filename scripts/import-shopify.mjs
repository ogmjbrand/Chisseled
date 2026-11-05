#!/usr/bin/env node
/**
 * ONE-TIME MIGRATION: copies products out of the old Shopify store into the
 * CHISSELED database. The running app never talks to Shopify — this script is
 * the only place Shopify is referenced, and it can be deleted after migrating.
 *
 *   SHOPIFY_STORE_DOMAIN=xxx.myshopify.com SHOPIFY_STOREFRONT_ACCESS_TOKEN=... \
 *   DATABASE_URL=... npm run import:shopify            # imports as DRAFT
 *   npm run import:shopify -- --activate               # imports as ACTIVE
 *
 * Idempotent: re-running updates products (matched by handle) and variants
 * (matched by option values) instead of duplicating them. Stock is set from
 * Shopify's quantityAvailable when the token has inventory scope; otherwise
 * it is left untouched (new variants start at 0 — set stock in /admin).
 * Images keep their Shopify CDN URLs; add cdn.shopify.com to IMAGE_REMOTE_HOSTS
 * until they are re-uploaded to Supabase Storage.
 */
import postgres from "postgres";
import { loadEnv } from "./lib/env.mjs";

loadEnv();
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
if (!domain || !token || !process.env.DATABASE_URL) {
  console.error("Set SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN and DATABASE_URL.");
  process.exit(1);
}
const activate = process.argv.includes("--activate");

const QUERY = `query Products($after: String) {
  products(first: 50, after: $after) {
    pageInfo { hasNextPage endCursor }
    edges { node {
      handle title description productType vendor tags
      options { name values }
      images(first: 20) { edges { node { url altText width height } } }
      variants(first: 100) { edges { node {
        title sku barcode quantityAvailable
        price { amount } compareAtPrice { amount }
        selectedOptions { name value }
      } } }
      collections(first: 10) { edges { node { handle title description } } }
    } }
  }
}`;

async function page(after) {
  const res = await fetch(`https://${domain}/api/2025-10/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token },
    body: JSON.stringify({ query: QUERY, variables: { after } }),
  });
  if (!res.ok) throw new Error(`Shopify responded ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
  return json.data.products;
}

const cents = (m) => (m?.amount ? Math.round(Number.parseFloat(m.amount) * 100) : null);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });

let products = 0;
let variants = 0;
try {
  let after = null;
  do {
    const conn = await page(after);
    for (const { node: p } of conn.edges) {
      await sql.begin(async (tx) => {
        const options = p.options.filter((o) => !(o.name === "Title" && o.values.length === 1 && o.values[0] === "Default Title"));
        const [row] = await tx`
          insert into products (slug, title, description, status, product_type, vendor, tags, options, published_at)
          values (${slug(p.handle)}, ${p.title}, ${p.description ?? ""}, ${activate ? "active" : "draft"}, ${p.productType ?? ""},
                  ${p.vendor || "CHISSELED"}, ${p.tags ?? []}, ${tx.json(options)}, ${activate ? new Date() : null})
          on conflict (slug) do update set title = excluded.title, description = excluded.description,
            product_type = excluded.product_type, tags = excluded.tags, options = excluded.options
          returning id`;
        await tx`delete from product_images where product_id = ${row.id}`;
        let pos = 0;
        for (const { node: img } of p.images.edges) {
          await tx`insert into product_images (product_id, url, alt, position, width, height)
                   values (${row.id}, ${img.url}, ${img.altText ?? ""}, ${pos++}, ${img.width}, ${img.height})`;
        }
        pos = 0;
        for (const { node: v } of p.variants.edges) {
          const opts = Object.fromEntries(
            v.selectedOptions.filter((o) => !(o.name === "Title" && o.value === "Default Title")).map((o) => [o.name, o.value]),
          );
          const compare = cents(v.compareAtPrice);
          const price = cents(v.price) ?? 0;
          const [vr] = await tx`
            insert into product_variants (product_id, title, sku, barcode, price_cents, compare_at_cents, options, position)
            values (${row.id}, ${Object.values(opts).join(" / ") || "Default"}, ${v.sku || null}, ${v.barcode || null},
                    ${price}, ${compare && compare > price ? compare : null}, ${tx.json(opts)}, ${pos++})
            on conflict (product_id, options) do update set price_cents = excluded.price_cents,
              compare_at_cents = excluded.compare_at_cents, sku = coalesce(excluded.sku, product_variants.sku),
              barcode = coalesce(excluded.barcode, product_variants.barcode)
            returning id`;
          await tx`insert into inventory (variant_id) values (${vr.id}) on conflict do nothing`;
          if (typeof v.quantityAvailable === "number" && v.quantityAvailable >= 0) {
            const [inv] = await tx`select on_hand, reserved from inventory where variant_id = ${vr.id} for update`;
            const target = Math.max(v.quantityAvailable, inv.reserved);
            if (target !== inv.on_hand) {
              await tx`update inventory set on_hand = ${target} where variant_id = ${vr.id}`;
              await tx`insert into inventory_movements (variant_id, reason, delta_on_hand, on_hand_after, reserved_after, note)
                       values (${vr.id}, 'import', ${target - inv.on_hand}, ${target}, ${inv.reserved}, 'Imported from Shopify')`;
            }
          }
          variants++;
        }
        for (const { node: c } of p.collections.edges) {
          const [col] = await tx`
            insert into collections (slug, title, description) values (${slug(c.handle)}, ${c.title}, ${c.description ?? ""})
            on conflict (slug) do update set title = collections.title returning id`;
          await tx`insert into product_collections (product_id, collection_id) values (${row.id}, ${col.id}) on conflict do nothing`;
        }
        await tx`insert into audit_logs (actor, action, entity_type, entity_id) values ('import', 'product.import', 'product', ${row.id})`;
      });
      products++;
      process.stdout.write(`\rimported ${products} products, ${variants} variants`);
    }
    after = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (after);
  console.log(`\ndone — products are ${activate ? "ACTIVE" : "DRAFT (review, then activate in /admin/products)"}.`);
} finally {
  await sql.end();
}
