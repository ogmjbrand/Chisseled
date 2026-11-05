# CHISSELED

A storefront for a performance apparel brand — apparel, training, and nutrition
treated as one system rather than three catalogues.

Built with Next.js 16 (App Router), React 19, TypeScript in strict mode, and
Tailwind CSS 4. No UI kit, no component library, no animation library: every
component, every mark, and the entire motion system is written for this project.
Commerce runs on its own backend — Supabase PostgreSQL, first-party auth,
Paystack and Flutterwave — with no Shopify dependency. Runtime dependencies:
`next`, `react`, `react-dom`, `postgres`.

```bash
npm install
cp .env.example .env.local          # fill in DATABASE_URL, payment keys, CRON_SECRET, APP_URL
npm run db:migrate                  # applies supabase/migrations
npm run admin:create-owner -- --email you@chisseled.com --name "Your Name"
npm run dev                         # http://localhost:3000 · admin at /admin
npm run lint && npm run typecheck && npm run build
```

---

## What is here

| | |
|---|---|
| Routes | 16 storefront pages + 25 admin screens, rendered per request from the database |
| Catalogue | 41 products across 6 collections, 4 bundles, 6 programmes, 6 articles |
| Components | 38, all first-party |
| Photography | 52 matted product shots, 5 editorial frames, 3 manufacturer size sheets |
| Identity | Brand lockup and shield, keyed to alpha; favicon, apple icon and OG card generated from them |
| Source | ~13,400 lines of TypeScript/TSX |

Commerce runs end to end on the CHISSELED database: catalogue → filtering →
product detail with colourway and size selection → bag → checkout → verified
payment → order confirmation → account order history, all managed from
`/admin`. Wishlist, recently viewed and display currency stay in `localStorage`.

---

## The identity

Black × Purple. Obsidian `#08080A`, Graphite `#17171B`, Brand Purple `#9630FC`,
Bright Purple `#B268FD`, Light `#F5F5F5`.

**The brand purple is measured off the logo, not chosen to sit near it.** The
supplied artwork is an additive glow — a base colour multiplied by an intensity
that falls off from the core — so no single pixel in the file *is* the brand
colour: the bright ones are blown out and the dim ones are half-way to black.
Every unclipped pixel is normalised to its own max channel to recover the
chromaticity the glow is made of, and the alpha-weighted mode of that is
`#9630FC`. The shield and the full lockup are separate files and they agree:
hue 270.0, saturation 0.97. The whole ramp is cut at that hue, so nothing on
the page drifts away from the mark.

The palette previously ran at hue 263 / S 0.70, a visibly bluer and greyer
violet than the logo it was standing in for.

The interesting constraint is that the brand colour is still not a body-text
colour on obsidian, and this is measured rather than eyeballed:

```
#9630fc as text on obsidian ......... 3.93:1   large type and UI marks only
#9630fc as a surface under #f5f5f5 .. 4.67:1   PASS — this is its job
#b268fd as text on obsidian ......... 6.00:1   PASS — accent type
```

So the brand colour is a *surface* and the bright step is the *ink*, and that
rule is written into `globals.css` next to the tokens so it cannot quietly
drift. Adopting the logo's own colour trades a little headroom as a surface
(6.52 → 4.67, still AA) for a lot as a mark (2.82 → 3.93, now over the 3:1 a
non-text graphic needs). Nothing is permitted to re-tint `#9630FC` to buy
contrast; where a surface cannot carry it, `--color-purple-dim` is the same hue
taken down in lightness.

**The mark is never recoloured.** There was briefly a bone monochrome shield,
introduced because the logo sank into the purple block behind the header on the
hero — a problem the new palette makes worse, since the block is now literally
the mark's own colour and the shield measured 1.93:1 against it. Repainting a
logo to make it legible is fixing the wrong object. The header carries its own
scrim instead, and the depth of that scrim was set by measuring the render
rather than modelling it: a first pass computed from flat colours predicted
5.8:1 and delivered 3.06:1, because the hero's block is not flat and is
brightest exactly where the mark sits. The shipped value, sampled off the
render, is 3.85:1. The monochrome file has been deleted so it cannot come back.

The same discipline applies to data marks: on the carbon card surface `#9630FC`
now reaches 3.76:1 and would be legal, but `#B268FD` still carries every mark in
the training dashboard at 5.73:1 — a chart wants headroom rather than the
minimum, and the brand colour reads as a surface everywhere else on the site.

One thing deliberately does *not* track the brand: the `violet` **colourway**
stays `#6D28D9`, because it describes the purple a garment is actually dyed.
Repainting merchandise to match a logo would be inventing a colourway that does
not ship.

---

## Working from reference material

Nine reference clips were supplied. They were treated as **blueprints, not
assets** — nothing from any clip ships. The method for each was: analyse the
clip, extract the visual mechanic, decide whether the site has a job for it,
rebuild it with CHISSELED's own content, then test it responsively.

**Six were applied:**

| Reference | Mechanic extracted | Where it went |
|---|---|---|
| Car slider | Hard vertical split, subject straddling the seam, oversized word *behind* the product, differential motion, spec strip, numbered index | Homepage hero |
| Particle fill | Density arriving over seconds rather than a burst; varied scale, drift and speed per particle | Order confirmation |
| Fitness app UI | The number is the hero, the goal is stated in words, the track only locates it | Training dashboard |
| Glowing icons | Four corner brackets *converging* into a closed frame — the convergence is the signal, the glow is the afterthought | Collection portals |
| Light-spill login | A light with a position and a falloff, so near is brighter than far | Sign-in panel |
| Card gallery | A deck, not a slider: the whole set stays visible behind the active card | Coaching bench |

Two of those were deliberately *not* reproduced faithfully. The glowing-icon
reference runs five saturated hues at once, which reads as a toolbar of logos;
CHISSELED has one accent, so the reticle earns its emphasis from motion and
containment instead. The light-spill reference makes its form genuinely
unreadable until you find the lamp cord — a puzzle, and a sign-in screen is the
worst possible place for one — so the light was given a job instead: it follows
the focused field, which is the question a dark form has to answer instantly. It
stays strictly additive, and every field keeps its own border focus state.

**Three were declined, with reasons:**

- *Login backgrounds* turned out not to be a technique at all — a reel swapping
  AI-generated wallpapers behind a frosted-glass card. Using it would mean
  inventing decorative imagery, which this project's rules forbid.
- *Figma-motion product scroll* and *the "10k app" scroll* are both a pinned
  product with type changing around it. The homepage's signature sequence
  already is that mechanic, better integrated. A second one would dilute it.

A reference is not a requirement. Forcing all nine in would have produced a
collection of recreated tutorials rather than a brand.

---

## Photography

The rule throughout: **real merchandise or nothing.** Where a real photograph of
a product exists it is used; where one does not, a deterministic procedural
technical flat stands in, clearly reading as a diagram rather than pretending to
be a photograph. No product, colourway, or garment detail is invented.

Supplier shots arrive on a white studio backdrop, which reads as a white
rectangle on an obsidian page. `scripts/key-product.py` mattes them: flood the
background inward *from the border only*, so white printed **inside** a garment
survives; erode 2px to kill the anti-aliased halo; feather what remains.

Background enclosed by the garment — the triangle between an arm and the torso,
the gap between crossed straps — is unreachable from the border and survives as
an opaque blob. Detecting those automatically was tried and reverted: every rule
loose enough to catch them also ate the white SCARRED print off a hoodie and 48k
pixels out of a training set, because a white print and a white backdrop are the
same colour. Nothing in the pixels separates them. They are named instead, one
seed point each.

A per-slug tolerance sits beside the named holes for the same reason. The
default flood tolerance is 52 levels, which is fine until a garment is nearly
white: the pale Realtree joggers photograph at `#fcfbf9` against a `#ffffff`
backdrop — six levels of separation — and at the default the flood walked
through the waistband and tore the legs open. That number is now measured off
the source and named per slug, not guessed.

`--repair` was removed rather than left broken. It re-punched holes on the
already-keyed *outputs*, but the seeds are in source coordinates and every
output is cropped to its bounding box, so the two frames disagreed by the size
of the trimmed margin. It also could not run twice: the second run found the
hole it had itself opened and called that an error. Re-running the normal
command re-mattes from the source, which is the only sound way to apply one.

Every matte was checked by rendering all of them over a transparency
checkerboard and looking, which is how a shot mapped to the wrong colourway was
caught — after a colour measurement had already flagged it and been overruled.

### Size guides

The size guide shows the manufacturer's own sheets as images, not as retyped
HTML. Every sheet supplied has a column cropped off in the source file: the tee
sheet lost its row labels, so rows read `67 / 70 / 73` with nothing saying
whether that is chest, length or shoulder; the upper-body sheet lost its
size-name column, so nine rows of real measurements cannot be tied to S, M or L.
Retyping them would mean guessing and then presenting the guess as a
specification. Showing the sheet leaves what is missing visibly missing, and
whatever *is* legible is also stated in text beneath it for screen readers.

This replaced a measurement table whose numbers had been invented.

---

## Notable engineering

**Motion.** One shared `IntersectionObserver` drives every reveal on the site,
wired to `data-reveal` attributes so server components can opt in without
shipping a client bundle. Scroll-linked sections derive every layer's transform
from a single rAF-throttled 0→1 value. Everything respects
`prefers-reduced-motion`, and the reduced path is never a degraded one: the
signature sequence renders as three static editorial panels with the same
content and the same argument.

**Type that fits.** The hero's oversized word is sized by measurement, not by
guessing an average character advance — a guess that had rendered SCARRED at
roughly twice the viewport width, so the brand's own name read "CARRE". An
offscreen probe measures each word once, and again after webfonts land.

**A Tailwind v4 hazard, documented at source.** `grain` and `vignette` are custom
utilities that set `position: relative` for their pseudo-elements, and they
override an unprefixed `absolute`, `fixed` or `sticky` class on the same element.
This silently un-pinned the homepage's signature sequence — it scrolled away and
left four blank screens — and separately collapsed every card in the coaching
deck to 2px. Both are fixed, and the hazard is now a comment on the utilities
themselves.

**Cross-fading words.** A triangular falloff cross-fades a photograph
beautifully; at the handover both frames sit at 0.5 and read as one dissolving
image. Words do not dissolve — two headlines at 0.5 stack into a double exposure.
Copy in the sequence now holds back until its stage is dominant, leaving a brief
clean gap instead of an illegible overlap.

---

## Verification

Checked by looking, not by trusting the code:

- All 20 primary routes crawled at 390px and 1440px — no 4xx, no console errors,
  no failed subresources, no horizontal scroll. The harness is
  `scripts/crawl.mjs`, so the claim is re-runnable rather than a note.
- Every product matte rendered over a checkerboard and reviewed by eye.
- Contrast ratios computed from relative luminance, not judged.
- Keyboard paths walked: tab order, focus-visible, the closed cart drawer and
  search panel correctly `inert`.

One harness bug is worth recording, because it produced two false alarms before
it was caught: horizontal overflow was being measured with
`documentElement.scrollWidth`, which lies here — `body { overflow-x: hidden }`
propagates to the viewport, so `scrollWidth` reports unclipped content on pages
that cannot actually scroll. The harness now asks whether the page scrolls.

---

## Commerce system

The storefront, cart, checkout and the `/admin` console all run on the
CHISSELED database. Design notes live in `docs/COMMERCE_PLAN.md`; the short
version:

| Concern | How it works |
|---|---|
| Data | `supabase/migrations` — products, variants, categories, collections, inventory + movements, customers + addresses + notes, carts, orders + items + events, payments, refunds, webhook events, discounts + redemptions, shipping zones/rates, shipments, campaigns, notifications, staff, roles, permissions, audit log. RLS on every table; browser keys can read only the active catalogue. |
| Stock | `reserved ≤ on_hand` is a table constraint. Checkout reserves with a conditional `UPDATE` inside one transaction, so two buyers can't take the last unit. Payment commits the sale; expiry or cancellation releases it. Every change is a row in `inventory_movements`. |
| Payments | Paystack, Flutterwave and Stripe (international). Server-side initialisation → provider-hosted page → redirect → **server-side verification** against the provider API (amount and currency re-checked). Webhooks are HMAC-verified over the raw body and deduplicated on `(provider, event_id)`. Secret keys never leave the server. |
| Admin | `/admin` — overview, products, collections, categories, orders (fulfil, refund, cancel, re-verify, printable invoice), customers (segments), inventory, payments, refunds, discounts, shipping, marketing (campaigns, abandoned carts), analytics, staff & roles, audit log, notifications, settings. Every page and action checks permissions server-side and every change is audited. |
| Customers | Guest checkout, accounts (scrypt-hashed passwords, httpOnly sessions), order history, profile, saved addresses, password change and emailed one-time reset links (guests can use one to claim an account). Guest orders join the account created with the same email. |
| Staff sales | `/admin/orders/new` for phone/WhatsApp/in-person orders: stock is reserved immediately, then staff record an offline payment (bank transfer, cash, POS — configurable) or send a Paystack/Flutterwave/Stripe payment link. Offline payments refund offline. |
| Marketing | Real newsletter list (footer sign-up, checkout and account opt-ins) with one-click unsubscribe; back-in-stock alerts per size, emailed once when stock returns; abandoned-cart reminders whose link restores the exact bag on any device. |
| Email | Order confirmation, shipped (with tracking), delivered, cancelled and refund emails, password resets and stock alerts via Resend. Without an email key nothing is sent and each order's timeline says so. |
| Exports | CSV of orders, customers, products/stock and subscribers, permission-checked and formula-injection safe. |
| Housekeeping | `GET /api/cron/maintenance` with `Authorization: Bearer $CRON_SECRET` every ~10 minutes: re-checks unpaid orders with the provider, releases expired reservations, marks abandoned carts, sends due back-in-stock alerts, prunes sessions. |
| Migrating off Shopify | `npm run import:shopify` copies products, variants, stock, images and collections once (as drafts unless `--activate`). It is the only code that mentions Shopify. |

### Going live checklist

1. Set `DATABASE_URL` (Supabase → Connect → transaction pooler) and run `npm run db:migrate`.
2. Create the owner account, then in `/admin`: shipping zones and rates, store currency and tax, products and stock.
3. Add `PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY` + `FLUTTERWAVE_WEBHOOK_HASH` and/or `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`, and point each provider's webhook at `/api/webhooks/<provider>`. Test with test keys first.
4. Set `APP_URL`, `CRON_SECRET` and schedule the maintenance call. Optional: `RESEND_API_KEY` + `EMAIL_FROM` for confirmation emails, `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for image uploads (public bucket `product-images`).

### End-to-end test

Two suites drive a real browser against a real Postgres and provider test
doubles (`scripts/e2e/mock-paystack.mjs` — Paystack, Stripe and Resend).
`commerce.e2e.mjs` (27 checks): admin sign-in,
product/zone/discount creation, browse → bag → checkout with a code → pay →
confirmation, DB consistency, webhook signature + idempotency, a two-shopper
race for the last unit, fulfilment, partial refund with restock, RBAC, the
maintenance job, and reservation expiry. `backend.e2e.mjs` (18 checks, runs
after it): newsletter, live search, wishlist, back-in-stock emails, customer
and staff password resets, account management, staff-created orders with
offline payment, Stripe payment link + signed webhooks + refund, shipping and
refund emails, CSV exports with RBAC, cart recovery and unsubscribe. 45/45 pass.

```bash
scripts/e2e/reset-db.sh                 # local Postgres
node scripts/e2e/mock-paystack.mjs &    # port 4010
PAYSTACK_SECRET_KEY=sk_test_mock PAYSTACK_BASE_URL=http://127.0.0.1:4010 \
  STRIPE_SECRET_KEY=sk_test_stripe_mock STRIPE_WEBHOOK_SECRET=whsec_test_mock STRIPE_BASE_URL=http://127.0.0.1:4010/v1 \
  RESEND_API_KEY=re_test_mock RESEND_BASE_URL=http://127.0.0.1:4010 EMAIL_FROM="CHISSELED <orders@chisseled.test>" \
  PAYMENTS_ALLOW_LOCAL=1 APP_URL=http://localhost:3100 CRON_SECRET=cron-test-secret \
  DATABASE_URL=postgres://postgres@127.0.0.1/chisseled npx next start -p 3100 &
export DATABASE_URL=postgres://postgres@127.0.0.1/chisseled
node scripts/e2e/commerce.e2e.mjs && node scripts/e2e/backend.e2e.mjs
```

---

## Honest limits

- Storefront prices display through the existing USD-based currency selector
  (GBP/EUR/CAD are presentational rates). Checkout always charges, and shows,
  the store currency set in `/admin/settings`.
- Flutterwave is implemented to its v3 API (initialise, verify by reference,
  signed webhooks, refunds) but the automated tests exercise Paystack and
  Stripe only; run a test-mode Flutterwave payment before enabling it.
- The loyalty tiers and referral programme described on `/account` are
  editorial copy; there is no points or referral backend yet.
- Reviews are not implemented, so no ratings are shown anywhere.
- The local editorial catalogue (`src/lib/catalog.ts`) still supplies copy for
  editorial sections; only products that are active in the database can be
  bought.

---

Built as a competition entry.
