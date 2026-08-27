import type { ColorwayKey, FlatKey, Tone } from "@/lib/art";

export type Gender = "women" | "men" | "unisex";

/**
 * The shop taxonomy is the five real CHISSELED collections. Gender stays a
 * filter rather than a top-level split, because most of these pieces are cut
 * for both.
 */
export type CollectionSlug =
  | "scarred"
  | "monogram"
  | "camo"
  | "tracksuits"
  | "essentials"
  | "statement";

export type Activity =
  | "lifting"
  | "running"
  | "training"
  | "yoga"
  | "recovery"
  | "everyday";

export type Fit = "compression" | "sculpt" | "relaxed" | "regular" | "oversized";

export interface Variant {
  colorway: ColorwayKey;
  /** Sizes currently in stock for this colourway. */
  inStock: string[];
  /** Sizes with fewer than 10 units — drives the scarcity signal honestly. */
  low: string[];
}

export interface Review {
  id: string;
  author: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  /** Reviewer's own fit note — the single most useful signal on a PDP. */
  fitNote?: "Runs small" | "True to size" | "Runs large";
  height?: string;
  sizeWorn?: string;
}

export interface Product {
  slug: string;
  name: string;
  /** The one-line editorial promise. */
  tagline: string;
  collection: CollectionSlug;
  gender: Gender;
  category: string;
  /** USD, in integer cents. */
  price: number;
  compareAt?: number;
  flat: FlatKey;
  /**
   * Real photography under /media/product.
   *
   * A string is one shot for the whole product. A record keyed by colourway is
   * a shot per colour, so choosing a colour on the PDP shows that actual
   * garment rather than recolouring one photo — which would misrepresent every
   * colour but the one photographed.
   *
   * Absent, or absent for the chosen colour, falls back to the technical flat.
   */
  media?: string | Partial<Record<string, string>>;
  variants: Variant[];
  sizes: string[];
  activities: Activity[];
  fit: Fit;
  badges?: string[];
  /** Long-form product story. */
  story: string;
  /** Engineering claims — what the garment actually does. */
  benefits: { title: string; detail: string }[];
  fabric: string;
  care: string;
  modelNote: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  related: string[];
  tone: Tone;
  /** Nutrition-only fields. */
  nutrition?: {
    what: string;
    when: string;
    who: string;
    why: string;
    servings: number;
    ingredients: { name: string; amount: string; note: string }[];
    subscribeDiscount: number;
  };
  isNew?: boolean;
  isMemberOnly?: boolean;
}

export interface Bundle {
  slug: string;
  name: string;
  tier: string;
  promise: string;
  description: string;
  items: string[];
  extras?: string[];
  price: number;
  saves: number;
  tone: Tone;
}

export interface Program {
  slug: string;
  name: string;
  discipline: string;
  weeks: number;
  daysPerWeek: number;
  level: "Foundation" | "Intermediate" | "Advanced";
  focus: string;
  summary: string;
  blocks: { name: string; weeks: string; intent: string }[];
  equipment: string;
  coach: string;
  tone: Tone;
  members: number;
}

export interface Athlete {
  slug: string;
  name: string;
  role: string;
  discipline: string;
  location: string;
  quote: string;
  story: string;
  /** Slug under /media/editorial. Absent falls back to the procedural figure. */
  photo?: string;
  stats: { label: string; value: string }[];
  tone: Tone;
  pose: "front" | "back";
}

export interface Article {
  slug: string;
  title: string;
  category: "Training" | "Nutrition" | "Recovery" | "Mindset" | "Style" | "Athlete Stories" | "Performance";
  excerpt: string;
  readMinutes: number;
  date: string;
  author: string;
  tone: Tone;
  body: string[];
}
