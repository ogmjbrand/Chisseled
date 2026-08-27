"use client";

import { useRevealObserver } from "@/lib/motion";

/**
 * Mounts the single document-wide reveal observer. Rendered once, in the
 * root layout, so every server component can simply write `data-reveal`
 * without shipping its own client bundle.
 */
export function RevealRoot() {
  useRevealObserver();
  return null;
}
