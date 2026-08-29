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
npm run build      # 72 static pages
npm run typecheck
```

---

## What is here

| | |
|---|---|
| Routes | 16 pages, 72 prerendered URLs |
| Catalogue | 41 products across 6 collections, 4 bundles, 6 programmes, 6 articles |
| Components | 38, all first-party |
| Photography | 52 matted product shots, 5 editorial frames, 3 manufacturer size sheets |
| Identity | Brand lockup and shield, keyed to alpha; favicon, apple icon and OG card generated from them |
| Source | ~13,400 lines of TypeScript/TSX |

Commerce runs end to end in the browser: catalogue → filtering → product detail
with colourway and size selection → bag → checkout → order confirmation.
Wishlist, search, bundle builder, and a fit quiz are all wired. Persistence is
`localStorage`; there is no backend, and the site says so where a customer would
otherwise assume one.

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

## Honest limits

This is a front-end demonstration, and it does not pretend otherwise on screen:

- No backend. Cart, wishlist and orders live in `localStorage`. Checkout
  validates and confirms but takes no payment, and says so.
- Authentication is not connected. The account page states this.
- Currency conversion uses fixed rates for USD, GBP, EUR and CAD. Prices are a
  USD MSRP architecture, not exchange-rate conversions from another market.
  Multi-language is not implemented — only the currency selector ships.
- The card form on the payment step is interface only. Its inputs deliberately
  carry no `cc-*` autocomplete hints, so no browser is invited to autofill a
  real card into a demonstration form, and nothing typed is transmitted or
  stored. In production it is replaced by the PSP's hosted fields.
- Headline social-proof figures are marked in the source as requiring
  verified values before launch.

---

Built as a competition entry.
