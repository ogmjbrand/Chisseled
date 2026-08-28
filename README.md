# CHISSELED

A storefront for a performance apparel brand — apparel, training, and nutrition
treated as one system rather than three catalogues.

Built with Next.js 16 (App Router), React 19, TypeScript in strict mode, and
Tailwind CSS 4. No UI kit, no component library, no animation library: every
component, every mark, and the entire motion system is written for this project.
Three runtime dependencies — `next`, `react`, `react-dom`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 47 static pages
npm run typecheck
```

---

## What is here

| | |
|---|---|
| Routes | 16 pages, 47 prerendered URLs |
| Catalogue | 20 products across 6 collections, 4 bundles, 6 programmes, 6 articles |
| Components | 38, all first-party |
| Photography | 27 matted product shots, 5 editorial frames, 3 manufacturer size sheets |
| Source | ~13,400 lines of TypeScript/TSX |

Commerce runs end to end in the browser: catalogue → filtering → product detail
with colourway and size selection → bag → checkout → order confirmation.
Wishlist, search, bundle builder, and a fit quiz are all wired. Persistence is
`localStorage`; there is no backend, and the site says so where a customer would
otherwise assume one.

---

## The identity

Black × Purple. Obsidian `#08080A`, Graphite `#17171B`, Brand Purple `#6D28D9`,
Bright Purple `#8B5CF6`, Light `#F5F5F5`.

The interesting constraint is that brand purple is not a legible text colour on
obsidian, and this was measured rather than eyeballed:

```
#6d28d9 as text on obsidian ......... 2.82:1   FAIL — never type
#6d28d9 as a surface under #f5f5f5 .. 6.52:1   PASS — this is its job
#8b5cf6 as text on obsidian ......... 4.73:1   PASS — accent type
```

So the brand colour is a *surface* and the bright tint is the *ink*, and that
rule is written into `globals.css` next to the tokens so it cannot quietly drift.
The same discipline applies to data marks: on the carbon card surface `#6d28d9`
reaches only 2.69:1, below the 3:1 a chart mark needs, so `#8b5cf6` carries every
mark in the training dashboard.

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

- All 17 primary routes crawled at 390px and 1440px — no 4xx, no console errors,
  no horizontal scroll.
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

## Honest limits

This is a front-end demonstration, and it does not pretend otherwise on screen:

- No backend. Cart, wishlist and orders live in `localStorage`. Checkout
  validates and confirms but takes no payment, and says so.
- Authentication is not connected. The account page states this.
- Currency conversion uses fixed rates for USD, GBP, EUR and CAD. Prices are a
  USD MSRP architecture, not exchange-rate conversions from another market.
  Multi-language is not implemented — only the currency selector ships.
- Headline social-proof figures are marked in the source as requiring
  verified values before launch.

---

Built as a competition entry.
