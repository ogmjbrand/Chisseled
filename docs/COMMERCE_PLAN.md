# CHISSELED Commerce — Audit & Implementation Plan

## 1. Audit (state before this work)

| Area | Finding |
|---|---|
| Framework | Next.js 16 App Router, React 19, TS strict, Tailwind 4. Three runtime deps. No lint config. |
| Commerce backend | **Shopify Storefront API** (`src/lib/shopify/*`): products, collections, cart (cookie `chisseled_cart_id`), checkout = redirect to Shopify's hosted `checkoutUrl`. |
| Shopify consumers | `app/{layout,page,shop,shop/[collection],product/[slug],bundles,fit,fuel,method,checkout}`, `components/sections/{FeaturedCollection,FuelSection,ShopByCollection,GenderEditorial}`, `lib/store.tsx` (cart server actions), `lib/assistant/catalog.ts`, `next.config.ts` (`cdn.shopify.com` images), `.env.example`, root diagnostic scripts `check-product*.mjs`, `verify-shopify-local.mts`. |
| Database | **None.** No Supabase client, no migrations. One Supabase project exists on the account ("Aye", empty) — not assumed to be Chiseled's; migrations are not applied to it without the owner's confirmation. |
| Auth | None. `/account` is a static marketing page with a non-functional sign-in panel. |
| Payments | None (Shopify hosted checkout). |
| Local catalogue | `src/lib/catalog.ts` holds editorial products; per commit `5a4634c` only 2 of 71 are real merchandise. They are **not** seeded as sellable stock. |

## 2. Architecture

- **Database:** Supabase PostgreSQL, accessed server-side only through `DATABASE_URL` with the `postgres` driver (real transactions, row locks). SQL migrations in `supabase/migrations`, applied by `npm run db:migrate` (or the Supabase CLI / dashboard).
- **RLS:** enabled on every table. Only `anon`/`authenticated` read policies are for *active* catalogue rows. Everything else (orders, customers, payments, staff…) has no client policy → denied to the browser keys. The app server is the only writer.
- **Auth:** first-party. Staff and customers have separate tables and sessions; passwords hashed with scrypt; sessions are random 256-bit tokens stored hashed, in `httpOnly`/`SameSite=Lax`/`Secure` cookies. Brute-force lockout + DB-backed rate limiting.
- **RBAC:** `roles` × `permissions` via `role_permissions`. Every admin server action calls `requirePermission(...)` server-side; UI hiding is cosmetic only.
- **Inventory:** `inventory.on_hand` / `inventory.reserved` with `CHECK (reserved <= on_hand)`. Checkout reserves stock with a conditional `UPDATE … WHERE on_hand - reserved >= qty` inside one transaction → overselling is impossible. Payment success commits (decrements both); cancellation/expiry releases. Every change writes an `inventory_movements` row.
- **Payments:** Paystack + Flutterwave behind one provider interface. Server-side initialisation, redirect, server-side verification against the provider API, HMAC-verified webhooks, idempotency via `webhook_events (provider, event_id)` unique key and an `orders.payment_status` state machine. Amount and currency are re-checked against the order before fulfilment. Refunds via provider APIs. Secret keys exist only in server env.
- **Storefront:** the existing UI is kept. `src/lib/shopify` is replaced by `src/lib/commerce`, which maps DB rows to the existing `Product` type so components are unchanged. Cart lives in `carts/cart_items`. `/checkout` becomes a first-party checkout.

## 3. Phases

1. Schema, migrations, RLS, seeds (roles/permissions/collections/categories), migration runner.
2. Core libraries: db, security (hashing, tokens, rate limit, validation), auth, RBAC, audit, settings.
3. Commerce services: catalogue, cart, pricing/discounts/shipping, checkout, inventory, orders, refunds, shipments, notifications, analytics.
4. Payments: Paystack, Flutterwave, webhooks, verification, refunds.
5. Storefront rewire: remove Shopify, product/collection/search from DB, cart, checkout, confirmation, customer accounts & order history.
6. Admin: `/admin` shell + all modules.
7. Tooling & verification: ESLint, typecheck, build, end-to-end workflow test against a real Postgres.

## 4. Configuration needed to go live

See `.env.example`. Live payments additionally need provider dashboards pointed at
`/api/webhooks/paystack` and `/api/webhooks/flutterwave`.
