#!/usr/bin/env python3
"""
Cut CHISSELED product shots out of their white studio background.

The supplier photography is shot on white. On an obsidian storefront an
un-keyed shot reads as a white rectangle, so every product image is matted
here: flood the background in from the border only (so white *inside* a
garment survives), punch the enclosed holes the flood cannot reach, erode
the matte 2px to take the anti-aliased fringe that otherwise shows as a
halo on dark, then feather what is left.

Nothing is repainted or generated — the garment pixels are the supplier's.

    python3 scripts/key-product.py <src> <slug> [<src> <slug> ...]
    python3 scripts/key-product.py --repair            # re-punch every output
"""
import sys, os
from PIL import Image, ImageFilter
from collections import deque

OUT = "public/media/product"
CAP = 1600

# Flooding the background in from the border is forgiving: everything it
# reaches is background by construction, so it can afford a loose tolerance.
TOL = 52

# Enclosed background — the triangle between an arm and the torso, the opening
# between crossed straps — is background the border flood can never reach, so
# it survives as an opaque white blob on a dark page.
#
# Detecting those automatically was tried and rejected: any rule loose enough
# to catch them also ate the white SCARRED print off the graphite hoodie and
# 48k pixels out of the fitted set, because a white print and a white backdrop
# are the same colour. Nothing in the pixels separates them — only knowing what
# the garment is does. So the holes are named, one seed point each, and the
# flood spreads from there. Two lines of data beats a heuristic that damages
# eight images to repair two.
#
# Coordinates are in the keyed output's own pixel space. To add one: open the
# file, find a point inside the blob, put it here, run --repair, and look at it.
HOLES = {
    "workout-set": [(245, 255), (607, 525)],   # arm-to-torso, and hip-to-hand
    "sports-bra":  [(704, 149), (249, 159), (455, 394)],   # the crossed straps
}


def punch_holes(im, alpha, seeds, tag=""):
    """
    Clear background that is enclosed by the garment, flooding out from a named
    seed point. Same tolerance as the border flood — the region is the same
    backdrop, it simply has no path to the edge.
    """
    if not seeds:
        return alpha
    w, h = im.size
    px = im.convert("RGB").load()
    ap = alpha.load()
    lim = 255 - TOL

    for sx, sy in seeds:
        if not (0 <= sx < w and 0 <= sy < h):
            raise SystemExit(f"{tag}: seed {sx},{sy} is outside {w}x{h}")
        c = px[sx, sy]
        if ap[sx, sy] == 0 or not all(v > lim for v in c):
            raise SystemExit(
                f"{tag}: seed {sx},{sy} is not enclosed background (rgb {c}, "
                f"alpha {ap[sx, sy]}) — the image changed, re-pick it")
        n = 0
        q = deque([(sx, sy)])
        while q:
            x, y = q.popleft()
            if ap[x, y] == 0:
                continue
            c = px[x, y]
            if not (c[0] > lim and c[1] > lim and c[2] > lim):
                continue
            ap[x, y] = 0
            n += 1
            for nx, ny in ((x+1, y), (x-1, y), (x, y+1), (x, y-1)):
                if 0 <= nx < w and 0 <= ny < h and ap[nx, ny] != 0:
                    q.append((nx, ny))
        print(f"    {tag}: hole at {sx},{sy} -> {n}px")

    return alpha


def key_white(im, tol=TOL, tag=""):
    im = im.convert("RGB"); w, h = im.size; px = im.load()
    a = Image.new("L", (w, h), 255); ap = a.load()
    seen = bytearray(w * h); q = deque()
    for x in range(w): q.append((x, 0)); q.append((x, h - 1))
    for y in range(h): q.append((0, y)); q.append((w - 1, y))
    lim = 255 - tol
    while q:
        x, y = q.popleft(); i = y * w + x
        if seen[i]: continue
        seen[i] = 1
        c = px[x, y]
        if not (c[0] > lim and c[1] > lim and c[2] > lim): continue
        ap[x, y] = 0
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]: q.append((nx, ny))
    a = punch_holes(im, a, HOLES.get(tag, []), tag=tag)
    a = a.filter(ImageFilter.MinFilter(5))
    a = a.filter(ImageFilter.GaussianBlur(0.7))
    im = im.convert("RGBA"); im.putalpha(a); return im


def repair():
    """Re-punch the named holes on already-keyed outputs, without re-matting."""
    print("punching named holes")
    for slug, seeds in HOLES.items():
        p = f"{OUT}/{slug}.webp"
        if not os.path.exists(p):
            raise SystemExit(f"{slug}: no output to repair")
        im = Image.open(p).convert("RGBA")
        a = im.split()[3]
        punch_holes(im, a, seeds, tag=slug)
        # The punch opens new edges, so the fringe guard is re-applied to them.
        a = a.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.GaussianBlur(0.7))
        im.putalpha(a)
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        im.save(p, "WEBP", quality=90, method=6)
        print(f"  {slug} -> {im.size[0]}x{im.size[1]}  {os.path.getsize(p)//1024}KB")


def run(pairs):
    os.makedirs(OUT, exist_ok=True)
    print(f"{'slug':<34}{'native':<12}{'out':<12}{'KB':>5}  fill%")
    for src, slug in pairs:
        im = Image.open(src); native = im.size
        im = key_white(im, tag=slug)
        bb = im.getbbox()
        if bb: im = im.crop(bb)
        if max(im.size) > CAP:
            s = CAP / max(im.size)
            im = im.resize((round(im.size[0]*s), round(im.size[1]*s)), Image.LANCZOS)
        p = f"{OUT}/{slug}.webp"
        im.save(p, "WEBP", quality=90, method=6)
        d = im.split()[3].get_flattened_data()
        cov = sum(1 for v in d if v > 8) / len(d)
        flag = "" if max(native) >= 480 else "  (low-res source)"
        print(f"{slug:<34}{f'{native[0]}x{native[1]}':<12}"
              f"{f'{im.size[0]}x{im.size[1]}':<12}{os.path.getsize(p)//1024:>5}  {cov*100:3.0f}%{flag}")


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--repair":
        repair()
    else:
        run(list(zip(args[0::2], args[1::2])))
