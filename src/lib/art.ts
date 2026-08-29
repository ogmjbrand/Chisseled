/**
 * CHISSELED ART DIRECTION ENGINE
 * ------------------------------------------------------------------
 * Every image on this site is authored, not licensed. Two visual
 * languages carry the brand:
 *
 *   1. SCULPTURE — faceted human forms in architectural light. The
 *      brand name made literal: the body rendered as chiselled planes.
 *      Used for campaign, editorial and category imagery.
 *
 *   2. FLATS — elevated technical garment drawings, the language of a
 *      design atelier's line sheet. Used for product imagery.
 *
 * Both are deterministic: the same seed always yields the same
 * composition, so server and client render identically and nothing
 * shifts on hydration.
 */

/* ==================================================================
   DETERMINISTIC RANDOM
   ================================================================== */

/** FNV-1a — stable across runtimes, unlike a naive char-code sum. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG — small, fast, good enough for composition jitter. */
export function rng(seed: string) {
  let a = hashSeed(seed);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ==================================================================
   TONE — the environment palettes
   ================================================================== */

export type Tone = "void" | "apparel" | "train" | "fuel" | "recover" | "bone";

export interface TonePalette {
  /** Deep field behind everything. */
  base: string;
  /** Mid-tone the form is modelled in. */
  mid: string;
  /** Highest-value plane on the form. */
  high: string;
  /** Rim / key light. The only saturated colour in the frame. */
  key: string;
  /** Atmospheric light shaft. */
  haze: string;
}

export const TONES: Record<Tone, TonePalette> = {
  // Obsidian ground throughout. Purple is the signal, never a wash.
  void: {
    base: "#050506",
    mid: "#17171b",
    high: "#55555f",
    key: "#f5f5f5",
    haze: "#2a2a32",
  },
  apparel: {
    base: "#08080a",
    mid: "#1b1b21",
    high: "#6a6a75",
    key: "#f5f5f5",
    haze: "#31313a",
  },
  train: {
    base: "#0b0616",
    mid: "#25104a",
    high: "#9630fc",
    key: "#b268fd",
    haze: "#45108a",
  },
  fuel: {
    base: "#0a0a0c",
    mid: "#242430",
    high: "#8c8c99",
    key: "#d4d4de",
    haze: "#363644",
  },
  recover: {
    base: "#07070c",
    mid: "#191926",
    high: "#5e5e75",
    key: "#b4b4cf",
    haze: "#26263a",
  },
  bone: {
    base: "#131317",
    mid: "#3a3a45",
    high: "#c6c6cf",
    key: "#fbfbfd",
    haze: "#55555f",
  },
};

/* ==================================================================
   SCULPTURE — the faceted figure
   ==================================================================
   Authored on a 1000 × 1200 stage. The silhouette is a single closed
   path; the facets are clipped to it, so the form always reads clean
   no matter how the lighting is randomised.
   ================================================================== */

/** Athletic torso, front. Shoulders wide, lats flared, waist tapered. */
export const TORSO_FRONT = `
M 500 96
C 470 96 452 104 448 120
L 442 206
C 424 220 404 228 380 236
C 330 250 288 262 252 292
C 226 314 214 350 210 396
C 206 444 216 490 232 540
C 246 584 258 620 266 664
L 348 664
C 342 620 338 578 340 540
C 342 500 336 466 330 440
C 348 420 356 400 360 378
C 366 420 374 470 380 516
C 386 566 392 616 396 664
L 398 760
C 396 812 390 856 384 892
L 500 908
L 616 892
C 610 856 604 812 602 760
L 604 664
C 608 616 614 566 620 516
C 626 470 634 420 640 378
C 644 400 652 420 670 440
C 664 466 658 500 660 540
C 662 578 658 620 652 664
L 734 664
C 742 620 754 584 768 540
C 784 490 794 444 790 396
C 786 350 774 314 748 292
C 712 262 670 250 620 236
C 596 228 576 220 558 206
L 552 120
C 548 104 530 96 500 96
Z`;

/** The chiselled planes. Each carries a light value 0 → 1. */
export const TORSO_FACETS: { d: string; light: number }[] = [
  // Traps and clavicle shelf
  { d: "M 448 120 L 552 120 L 566 214 L 500 240 L 434 214 Z", light: 0.34 },
  { d: "M 434 214 L 500 240 L 470 300 L 372 268 Z", light: 0.52 },
  { d: "M 566 214 L 500 240 L 530 300 L 628 268 Z", light: 0.2 },
  // Deltoids
  { d: "M 372 268 L 252 292 L 214 372 L 268 404 L 336 340 Z", light: 0.62 },
  { d: "M 628 268 L 748 292 L 786 372 L 732 404 L 664 340 Z", light: 0.16 },
  // Pectorals
  { d: "M 470 300 L 336 340 L 330 440 L 480 424 L 496 356 Z", light: 0.46 },
  { d: "M 530 300 L 664 340 L 670 440 L 520 424 L 504 356 Z", light: 0.24 },
  // Serratus / rib cage
  { d: "M 330 440 L 268 404 L 240 520 L 320 556 L 348 480 Z", light: 0.4 },
  { d: "M 670 440 L 732 404 L 760 520 L 680 556 L 652 480 Z", light: 0.14 },
  // Abdominal blocks — left, centre, right
  { d: "M 480 424 L 520 424 L 524 520 L 476 520 Z", light: 0.58 },
  { d: "M 476 520 L 524 520 L 528 612 L 472 612 Z", light: 0.5 },
  { d: "M 472 612 L 528 612 L 534 712 L 466 712 Z", light: 0.42 },
  { d: "M 348 480 L 476 520 L 472 612 L 396 640 Z", light: 0.3 },
  { d: "M 652 480 L 524 520 L 528 612 L 604 640 Z", light: 0.18 },
  // Obliques into the hip vee
  { d: "M 396 640 L 466 712 L 448 852 L 384 892 Z", light: 0.26 },
  { d: "M 604 640 L 534 712 L 552 852 L 616 892 Z", light: 0.12 },
  { d: "M 466 712 L 534 712 L 552 852 L 500 908 L 448 852 Z", light: 0.36 },
  // Arms
  { d: "M 268 404 L 232 540 L 266 664 L 348 664 L 320 556 Z", light: 0.44 },
  { d: "M 732 404 L 768 540 L 734 664 L 652 664 L 680 556 Z", light: 0.1 },
];

/** Back view — the sweep of the lats is the whole story. */
export const TORSO_BACK = `
M 500 100
C 466 100 450 110 446 128
L 440 200
C 402 216 344 232 300 256
C 250 284 222 330 214 392
C 206 456 218 528 240 592
C 252 628 262 650 268 668
L 350 668
C 340 622 334 570 336 520
C 338 470 330 436 322 412
C 356 452 392 486 434 512
C 470 534 486 566 492 604
L 500 660
L 508 604
C 514 566 530 534 566 512
C 608 486 644 452 678 412
C 670 436 662 470 664 520
C 666 570 660 622 650 668
L 732 668
C 738 650 748 628 760 592
C 782 528 794 456 786 392
C 778 330 750 284 700 256
C 656 232 598 216 560 200
L 554 128
C 550 110 534 100 500 100
Z`;

export const TORSO_BACK_FACETS: { d: string; light: number }[] = [
  { d: "M 446 128 L 554 128 L 572 210 L 500 246 L 428 210 Z", light: 0.3 },
  { d: "M 428 210 L 500 246 L 476 330 L 320 288 Z", light: 0.5 },
  { d: "M 572 210 L 500 246 L 524 330 L 680 288 Z", light: 0.18 },
  { d: "M 320 288 L 222 350 L 236 470 L 336 452 L 400 366 Z", light: 0.6 },
  { d: "M 680 288 L 778 350 L 764 470 L 664 452 L 600 366 Z", light: 0.14 },
  { d: "M 476 330 L 400 366 L 434 512 L 492 604 L 500 400 Z", light: 0.44 },
  { d: "M 524 330 L 600 366 L 566 512 L 508 604 L 500 400 Z", light: 0.22 },
  { d: "M 336 452 L 236 470 L 268 668 L 350 668 L 322 540 Z", light: 0.38 },
  { d: "M 664 452 L 764 470 L 732 668 L 650 668 L 678 540 Z", light: 0.1 },
];

export type Pose = "front" | "back";

export function poseGeometry(pose: Pose) {
  return pose === "back"
    ? { silhouette: TORSO_BACK, facets: TORSO_BACK_FACETS }
    : { silhouette: TORSO_FRONT, facets: TORSO_FACETS };
}

/* ==================================================================
   FLATS — garment technical drawings
   ==================================================================
   Authored on a 400 × 500 stage. `outline` is the cut of the garment;
   `seams` are the construction lines that make it read as engineered
   rather than illustrated; `panel` regions take the colourway fill.
   ================================================================== */

export interface GarmentFlat {
  outline: string;
  /** Construction / topstitch lines. */
  seams: string[];
  /** Regions that carry the colourway at higher opacity. */
  panels?: string[];
  /** Where the woven brand tab sits. */
  tab?: { x: number; y: number; r: number };
}

export const FLATS: Record<string, GarmentFlat> = {
  /* ---------- WOMEN ---------- */
  leggings: {
    outline:
      "M 148 40 L 252 40 L 262 92 L 268 190 L 274 300 L 276 452 L 226 452 L 214 320 L 200 236 L 186 320 L 174 452 L 124 452 L 126 300 L 132 190 L 138 92 Z",
    seams: [
      "M 138 92 L 262 92",
      "M 200 96 L 200 236",
      "M 132 190 C 166 206 234 206 268 190",
      "M 148 40 C 176 56 224 56 252 40",
      "M 126 300 C 158 312 176 312 186 320",
      "M 274 300 C 242 312 224 312 214 320",
    ],
    panels: [
      "M 132 190 C 166 206 234 206 268 190 L 274 300 L 276 452 L 226 452 L 214 320 L 200 236 L 186 320 L 174 452 L 124 452 L 126 300 Z",
    ],
    tab: { x: 246, y: 66, r: 7 },
  },
  bra: {
    outline:
      "M 92 118 L 130 84 C 160 108 240 108 270 84 L 308 118 L 300 156 C 300 214 262 250 200 250 C 138 250 100 214 100 156 Z",
    seams: [
      "M 100 156 C 140 176 260 176 300 156",
      "M 200 176 L 200 250",
      "M 130 84 C 158 132 158 176 152 208",
      "M 270 84 C 242 132 242 176 248 208",
    ],
    panels: ["M 100 156 C 140 176 260 176 300 156 L 300 168 C 296 220 258 250 200 250 C 142 250 104 220 100 168 Z"],
    tab: { x: 200, y: 138, r: 7 },
  },
  crop: {
    outline:
      "M 108 96 L 156 68 C 180 86 220 86 244 68 L 292 96 L 320 148 L 288 172 L 280 140 L 278 244 L 122 244 L 120 140 L 112 172 L 80 148 Z",
    seams: [
      "M 122 244 C 160 232 240 232 278 244",
      "M 156 68 C 180 96 220 96 244 68",
      "M 120 140 L 278 140",
    ],
    panels: ["M 120 140 L 278 140 L 278 244 L 122 244 Z"],
    tab: { x: 258, y: 214, r: 6 },
  },

  /* ---------- MEN ---------- */
  tee: {
    outline:
      "M 104 92 L 158 62 C 182 88 218 88 242 62 L 296 92 L 336 158 L 296 186 L 284 156 L 284 342 L 116 342 L 116 156 L 104 186 L 64 158 Z",
    seams: [
      "M 158 62 C 182 92 218 92 242 62",
      "M 116 156 L 116 342",
      "M 284 156 L 284 342",
      "M 116 342 C 160 330 240 330 284 342",
    ],
    panels: [],
    tab: { x: 200, y: 300, r: 7 },
  },
  compressionTop: {
    outline:
      "M 118 88 L 160 60 C 182 84 218 84 240 60 L 282 88 L 300 148 L 288 320 L 112 320 L 100 148 Z",
    seams: [
      "M 160 60 C 182 88 218 88 240 60",
      "M 100 148 C 140 164 260 164 300 148",
      "M 200 100 L 200 320",
      "M 116 230 C 156 242 244 242 284 230",
    ],
    panels: [
      "M 100 148 C 140 164 260 164 300 148 L 292 240 L 108 240 Z",
    ],
    tab: { x: 200, y: 128, r: 6 },
  },
  shorts: {
    outline:
      "M 116 116 L 284 116 L 296 200 L 302 320 L 224 320 L 210 216 L 200 190 L 190 216 L 176 320 L 98 320 L 104 200 Z",
    seams: [
      "M 104 158 L 296 158",
      "M 200 162 L 200 190",
      "M 98 320 C 132 306 160 306 176 320",
      "M 302 320 C 268 306 240 306 224 320",
    ],
    panels: ["M 104 158 L 296 158 L 302 320 L 224 320 L 210 216 L 200 190 L 190 216 L 176 320 L 98 320 Z"],
    tab: { x: 268, y: 138, r: 6 },
  },
  hoodie: {
    // A hoodie, drawn as one: hood over the shoulder line, long sleeves to a
    // ribbed cuff, kangaroo pocket. The previous geometry here was a
    // short-sleeve crew, which misrepresented every product using it.
    outline:
      "M 138 110 C 132 48 268 48 262 110 L 292 130 L 332 150 L 358 318 L 314 332 L 296 180 L 296 404 L 104 404 L 104 180 L 86 332 L 42 318 L 68 150 L 108 130 Z",
    seams: [
      "M 138 110 C 150 72 250 72 262 110",
      "M 140 112 C 162 132 238 132 260 112",
      "M 108 130 L 104 180",
      "M 292 130 L 296 180",
      "M 130 302 L 142 264 L 258 264 L 270 302",
      "M 104 372 L 296 372",
      "M 92 302 L 48 288",
      "M 308 302 L 352 288",
      "M 186 118 L 182 172",
      "M 214 118 L 218 172",
    ],
    panels: ["M 130 302 L 142 264 L 258 264 L 270 302 Z"],
    tab: { x: 200, y: 218, r: 8 },
  },
  jacket: {
    outline:
      "M 100 104 L 154 70 L 200 92 L 246 70 L 300 104 L 340 196 L 298 224 L 286 190 L 286 380 L 114 380 L 114 190 L 102 224 L 60 196 Z",
    seams: [
      "M 200 92 L 200 380",
      "M 154 70 L 200 92 L 246 70",
      "M 114 190 L 114 380",
      "M 286 190 L 286 380",
      "M 130 300 L 176 300",
      "M 224 300 L 270 300",
    ],
    panels: ["M 114 190 L 200 190 L 200 380 L 114 380 Z"],
    tab: { x: 236, y: 128, r: 6 },
  },

  /* ---------- ACCESSORIES ---------- */
  socks: {
    outline:
      "M 138 60 L 214 60 L 220 244 C 220 290 250 312 288 316 L 292 372 C 218 370 152 322 146 250 Z",
    seams: [
      "M 138 96 L 216 96",
      "M 142 130 L 218 130",
      "M 220 244 C 244 268 268 280 290 284",
    ],
    panels: ["M 138 60 L 214 60 L 216 118 L 139 118 Z"],
    tab: { x: 176, y: 180, r: 6 },
  },
  bag: {
    outline:
      "M 76 152 L 324 152 L 336 336 L 64 336 Z",
    seams: [
      "M 76 152 C 100 108 300 108 324 152",
      "M 140 130 L 140 152",
      "M 260 130 L 260 152",
      "M 64 262 L 336 262",
      "M 148 262 L 148 336",
      "M 252 262 L 252 336",
    ],
    panels: ["M 70 262 L 332 262 L 336 336 L 64 336 Z"],
    tab: { x: 200, y: 208, r: 9 },
  },
  cap: {
    outline:
      "M 82 250 C 82 158 130 108 200 108 C 270 108 318 158 318 250 L 318 262 L 82 262 Z",
    seams: [
      "M 200 108 L 200 262",
      "M 130 124 C 160 176 168 220 168 262",
      "M 270 124 C 240 176 232 220 232 262",
      "M 82 262 C 120 300 280 300 318 262",
    ],
    panels: ["M 82 262 C 120 300 280 300 318 262 L 318 250 L 82 250 Z"],
    tab: { x: 200, y: 150, r: 7 },
  },
  band: {
    outline: "M 70 196 L 330 196 L 330 262 L 70 262 Z",
    seams: ["M 70 218 L 330 218", "M 70 240 L 330 240", "M 200 196 L 200 262"],
    panels: ["M 70 218 L 330 218 L 330 240 L 70 240 Z"],
    tab: { x: 200, y: 229, r: 7 },
  },

  /* ---------- PERFORMANCE / NUTRITION ---------- */
  tub: {
    outline:
      "M 118 132 L 282 132 L 292 380 L 108 380 Z",
    seams: [
      "M 118 132 L 118 108 L 282 108 L 282 132",
      "M 108 200 L 292 200",
      "M 108 322 L 292 322",
    ],
    panels: ["M 108 200 L 292 200 L 292 322 L 108 322 Z"],
    tab: { x: 200, y: 262, r: 12 },
  },
  shaker: {
    outline:
      "M 140 148 L 260 148 L 272 372 C 272 384 264 390 252 390 L 148 390 C 136 390 128 384 128 372 Z",
    seams: [
      "M 140 148 L 140 116 L 260 116 L 260 148",
      "M 132 236 L 268 236",
      "M 134 300 L 266 300",
      "M 240 250 L 240 360",
    ],
    panels: ["M 132 236 L 268 236 L 270 300 L 134 300 Z"],
    tab: { x: 200, y: 268, r: 10 },
  },
  sachet: {
    outline:
      "M 128 120 L 272 120 L 280 372 L 120 372 Z",
    seams: [
      "M 128 142 L 272 142",
      "M 122 348 L 278 348",
      "M 200 160 L 200 336",
    ],
    panels: ["M 128 142 L 272 142 L 277 300 L 123 300 Z"],
    tab: { x: 200, y: 232, r: 11 },
  },
  roller: {
    outline:
      "M 84 200 L 316 200 C 328 200 336 214 336 236 C 336 258 328 272 316 272 L 84 272 C 72 272 64 258 64 236 C 64 214 72 200 84 200 Z",
    seams: [
      "M 116 200 L 116 272",
      "M 164 200 L 164 272",
      "M 236 200 L 236 272",
      "M 284 200 L 284 272",
    ],
    panels: [],
    tab: { x: 200, y: 236, r: 9 },
  },
};

export type FlatKey = keyof typeof FLATS;

/* ==================================================================
   COLOURWAYS
   ================================================================== */

export interface Colorway {
  name: string;
  /** Hex the garment body is rendered in. */
  hex: string;
  /** Seam / topstitch colour. */
  seam: string;
}

export const COLORWAYS: Record<string, Colorway> = {
  // Drawn from the actual garments, not from the brand palette — customers
  // receive these colours, so they are described honestly.
  onyx: { name: "Onyx", hex: "#141518", seam: "#3c4047" },
  graphite: { name: "Graphite", hex: "#5a565b", seam: "#8a848c" },
  heather: { name: "Heather Grey", hex: "#8b8d92", seam: "#b9bbbf" },
  bone: { name: "Bone", hex: "#e4e2dc", seam: "#8f9089" },
  royal: { name: "Steel Blue", hex: "#4c6480", seam: "#7d94ad" },
  sage: { name: "Sage", hex: "#818886", seam: "#a8afad" },
  blush: { name: "Blush", hex: "#b89c9b", seam: "#d6bcbb" },
  camo: { name: "Woodland Camo", hex: "#4a4632", seam: "#7b7455" },
  rust: { name: "Rust", hex: "#9a5424", seam: "#c98450" },
  // A garment colour, not the brand mark — this is the purple the piece is
  // actually dyed. It deliberately does NOT track --color-purple: the
  // catalogue describes merchandise, and repainting a product to match a
  // logo would be inventing a colourway that does not ship.
  violet: { name: "Violet", hex: "#6d28d9", seam: "#8b5cf6" },
  sand: { name: "Sand", hex: "#c9b39b", seam: "#e0cfbd" },
  // Sampled from the Actively crest tees, not chosen from a palette.
  forest: { name: "Forest", hex: "#184038", seam: "#2f6555" },
  cobalt: { name: "Cobalt", hex: "#203070", seam: "#3c52a4" },
  crimson: { name: "Crimson", hex: "#800018", seam: "#b03040" },
  red: { name: "Signal Red", hex: "#ba454a", seam: "#d97b7f" },
  deer: { name: "Woodland — Deer", hex: "#685b4c", seam: "#8f8271" },
  boar: { name: "Woodland — Boar", hex: "#5f5144", seam: "#877868" },
  ibex: { name: "Woodland — Ibex", hex: "#605142", seam: "#887866" },
};

export type ColorwayKey = keyof typeof COLORWAYS;
