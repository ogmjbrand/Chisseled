// READ-ONLY Shopify Storefront API verification.
//
// This is a standalone diagnostic script, NOT part of the application. It
// imports the real, unmodified application modules directly and exercises
// them against the real Storefront API:
//   - src/lib/shopify/client.ts   (shopifyFetch — the actual transport)
//   - src/lib/shopify/queries.ts  (the actual GraphQL documents)
//   - src/lib/shopify/index.ts    (getProducts, getProductByHandle,
//                                  getCollections, createCart, addToCart,
//                                  getCart — the actual exported functions)
//   - src/lib/shopify/mappers.ts  (findShopifyVariant — the actual
//                                  colour/size → Shopify variant matching)
// Nothing here reimplements any Shopify logic — it only calls the code
// that already exists in this project.
//
// It makes no purchase and enters no payment information. The only writes
// it performs against your Shopify store are: creating one empty cart and
// adding one unit of one real, available variant to it — the same effect
// as a customer clicking "Add to bag" once. It does not touch products,
// customers, orders, or store settings.
//
// HOW TO RUN (Windows, PowerShell or cmd.exe):
//   1. Open a terminal in the root of your Chisseled checkout (the folder
//      containing package.json and this file).
//   2. Confirm your real .env.local (with SHOPIFY_STORE_DOMAIN and
//      SHOPIFY_STOREFRONT_ACCESS_TOKEN) is in that same folder.
//   3. Run:
//        npx tsx verify-shopify-local.mts
//      (npx will fetch tsx automatically on first run — no project files
//      are changed by this; it does not touch package.json.)
//   4. Read the console output. Your token/secret is never printed —
//      only "present: true/false" and the real, non-secret Shopify data
//      returned (handles, titles, prices, etc.).
//
// Delete this file whenever you're done with it; it is a diagnostic tool,
// not a feature of the storefront.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const envPath = path.join(ROOT, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error(`ERROR: ${envPath} not found. Run this from the root of your Chisseled checkout, next to package.json and your real .env.local.`);
  process.exit(1);
}
for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
  if (!line.includes("=")) continue;
  const i = line.indexOf("=");
  const k = line.slice(0, i).trim();
  const v = line.slice(i + 1).trim();
  if (k) process.env[k] = v;
}

const log = (label: string, ...rest: unknown[]) => console.log(`\n[${label}]`, ...rest);
const results: Record<string, "PASS" | "FAIL" | "NOT TESTABLE"> = {
  "SHOPIFY CONNECTION": "FAIL",
  "PRODUCT READ": "FAIL",
  "COLLECTION READ": "FAIL",
  "PRODUCT DETAILS": "FAIL",
  "INVENTORY READ": "FAIL",
  "VARIANT RESOLUTION": "NOT TESTABLE",
  "CART CREATE": "NOT TESTABLE",
  "ADD TO CART": "NOT TESTABLE",
  "CART READ": "NOT TESTABLE",
  "CHECKOUT URL": "NOT TESTABLE",
};

log("STEP 1-2", "domain set:", Boolean(process.env.SHOPIFY_STORE_DOMAIN), "| token set:", Boolean(process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN));

const { shopifyFetch } = await import(path.join(ROOT, "src/lib/shopify/client.ts"));
const queries = await import(path.join(ROOT, "src/lib/shopify/queries.ts"));
const shopifyIndex = await import(path.join(ROOT, "src/lib/shopify/index.ts"));
const mappers = await import(path.join(ROOT, "src/lib/shopify/mappers.ts"));
const art = await import(path.join(ROOT, "src/lib/art.ts"));

// ---- STEP 3: real authenticated request via the EXISTING client.ts + PRODUCTS_QUERY ----
log("STEP 3", "raw shopifyFetch(PRODUCTS_QUERY) via existing client.ts ...");
const raw = await shopifyFetch<{ products: { edges: { node: any }[] } }>({
  query: queries.PRODUCTS_QUERY,
  variables: { first: 10, after: null },
});
log("STEP 3 RESULT", { networkError: raw.networkError, errors: raw.errors ?? null, hasData: raw.data !== null });

if (!raw.data) {
  log("STOPPING", "No data from Shopify — reporting as-is, not fabricating further steps.");
  console.log("\n=== FINAL RESULTS ===\n" + JSON.stringify(results, null, 2));
  process.exit(0);
}

results["SHOPIFY CONNECTION"] = "PASS";

// ---- STEP 4-5: existing getProducts() ----
const products = await shopifyIndex.getProducts(10);
log("STEP 4-5", "products.length =", products.length);
if (products.length > 0) {
  results["PRODUCT READ"] = "PASS";
  log("ALL HANDLES", products.map((p: any) => p.handle));
  const p = products[0];
  log("FIRST PRODUCT", {
    handle: p.handle,
    title: p.title,
    price: p.variants[0]?.price,
    compareAtPrice: p.variants[0]?.compareAtPrice,
    quantityAvailable: p.variants[0]?.quantityAvailable,
    imageCount: p.images.length,
  });
  if (p.title && p.variants.length > 0) results["PRODUCT DETAILS"] = "PASS";
  if (p.variants.some((v: any) => v.quantityAvailable !== null)) results["INVENTORY READ"] = "PASS";
}

// ---- STEP 6: getProductByHandle with a REAL handle ----
let realProduct: any = null;
if (products.length > 0) {
  realProduct = await shopifyIndex.getProductByHandle(products[0].handle);
  log("STEP 6", realProduct ? `resolved ${realProduct.handle}` : "NULL");
}

// ---- STEP 7: getCollections() ----
const collections = await shopifyIndex.getCollections(10);
log("STEP 7", "collections.length =", collections.length, collections.map((c: any) => c.handle));
if (collections.length > 0) results["COLLECTION READ"] = "PASS";

// ---- STEP 9: findShopifyVariant() from mappers.ts ----
if (realProduct) {
  const fv = realProduct.variants[0];
  const opts = fv?.selectedOptions ?? [];
  const colorOpt = opts.find((o: any) => /^colou?r$/i.test(o.name));
  const sizeOpt = opts.find((o: any) => o.name.toLowerCase() === "size");
  const colorValue = colorOpt?.value?.trim().toLowerCase();
  let colorwayKey: string | undefined;
  if (colorValue) {
    for (const k of Object.keys(art.COLORWAYS)) {
      if (k === colorValue || art.COLORWAYS[k].name.toLowerCase() === colorValue) { colorwayKey = k; break; }
    }
  }
  const resolved = mappers.findShopifyVariant(realProduct, (colorwayKey ?? "onyx") as any, sizeOpt?.value ?? "");
  log("STEP 9", { colorwayKey, matched: resolved?.id === fv.id });
  if (resolved) results["VARIANT RESOLUTION"] = "PASS";

  // ---- Cart flow via existing createCart / addToCart / getCart ----
  const variantToUse = realProduct.variants.find((v: any) => v.availableForSale) ?? fv;
  if (variantToUse) {
    const created = await shopifyIndex.createCart([]);
    log("STEP CART CREATE", { hasCart: Boolean(created.cart), userErrors: created.userErrors });
    if (created.cart) {
      results["CART CREATE"] = "PASS";
      const added = await shopifyIndex.addToCart(created.cart.id, [{ merchandiseId: variantToUse.id, quantity: 1 }]);
      log("STEP ADD TO CART", { hasCart: Boolean(added.cart), lineCount: added.cart?.lines.length, userErrors: added.userErrors });
      if (added.cart?.lines.length) {
        results["ADD TO CART"] = "PASS";
        results["CHECKOUT URL"] = added.cart.checkoutUrl ? "PASS" : "FAIL";
        log("CHECKOUT URL PRESENT", Boolean(added.cart.checkoutUrl));
        const reread = await shopifyIndex.getCart(added.cart.id);
        results["CART READ"] = reread?.id === added.cart.id ? "PASS" : "FAIL";
        log("CART READ", { matches: reread?.id === added.cart.id, lineCount: reread?.lines.length });
      }
    }
  }
}

console.log("\n=== FINAL RESULTS ===");
console.log(JSON.stringify(results, null, 2));
log("DONE", "No purchase made, no payment info entered, no products/customers/orders/settings modified.");
