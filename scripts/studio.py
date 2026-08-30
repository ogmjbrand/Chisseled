#!/usr/bin/env python3
"""
Normalise every matted product shot to one framing standard.

THE POINT. The catalogue is real merchandise photographed by a dozen different
suppliers: aspect ratios run from 0.19 to 1.64, subjects sit at wildly
different scales, and the grid reads as a scrapbook rather than a shoot. This
puts every cutout on the same canvas, at the same relative size, with the same
margins, so a page of products looks like one session.

WHAT IT WILL NOT DO. It never repaints a product pixel. The garment is only
ever scaled down and positioned — no upscaling, no sharpening, no relighting,
no generative fill. That is a deliberate line: at these source resolutions
(21 assets are under 420px on the long edge) a generative upscaler has no real
detail to recover, so it invents seam lines, logo edges and camouflage. An
invented seam on a real product is a lie about the merchandise, and it is the
one thing this catalogue is not allowed to do. Soft-but-true beats sharp-and-
wrong. Better sources are the only fix for resolution.

The studio itself — ground, key light, shadow — is drawn at render time in
ProductMedia, not baked in here, so the look is one place to change and the
assets stay pure product on transparency.

Idempotent: it crops to the alpha bounding box first, so re-running does not
compound the padding.

    python3 scripts/studio.py            # every asset
    python3 scripts/studio.py <slug> ... # named ones
"""
import sys, os
from PIL import Image

OUT = "public/media/product"

# 3:4 portrait. The median of the incoming set is 0.69, so this is close to
# what most suppliers already shoot and costs the least re-framing.
ASPECT = 3 / 4

# The subject's safe box inside the canvas. Slightly tighter vertically than
# horizontally, and the subject sits a little above centre, which leaves room
# under it for the contact shadow the page draws.
SAFE_W, SAFE_H = 0.86, 0.84
CENTRE_Y = 0.47


def frame(im: Image.Image) -> Image.Image:
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    w, h = im.size

    # The canvas is derived FROM the subject, never the other way round: it is
    # the smallest 3:4 frame in which the subject fills the safe box. That way
    # the product is never scaled up to meet a fixed canvas size.
    cw = max(w / SAFE_W, (h / SAFE_H) * ASPECT)
    ch = cw / ASPECT
    cw, ch = round(cw), round(ch)

    canvas = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    canvas.paste(im, ((cw - w) // 2, round(ch * CENTRE_Y - h / 2)), im)
    return canvas


def run(slugs):
    files = [f"{s}.webp" for s in slugs] if slugs else sorted(os.listdir(OUT))
    print(f"{'asset':<36}{'before':<12}{'after':<12}{'scale':>6}")
    for f in files:
        p = os.path.join(OUT, f)
        if not os.path.exists(p):
            raise SystemExit(f"{f}: not found")
        im = Image.open(p).convert("RGBA")
        before = im.size
        out = frame(im)
        out.save(p, "WEBP", quality=90, method=6)
        print(f"{f.replace('.webp',''):<36}{f'{before[0]}x{before[1]}':<12}"
              f"{f'{out.size[0]}x{out.size[1]}':<12}{'1.00':>6}")


if __name__ == "__main__":
    run(sys.argv[1:])
