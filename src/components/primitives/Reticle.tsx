"use client";

import type { ReactNode } from "react";

/**
 * Lock-on reticle, built on the glowing-icon reference.
 *
 * The reference's interesting move is not the glow — it is the four corner
 * brackets converging inward and closing into a frame when a tile activates.
 * The glow is the afterthought; the convergence is the signal. So that is what
 * is reproduced, and the bloom is kept deliberately faint.
 *
 * The reference also runs five saturated brand hues at once, which reads as a
 * toolbar of logos. CHISSELED has one accent, so the reticle carries brand
 * purple only and earns its emphasis from motion and containment rather than
 * from saturation. That keeps it premium instead of neon.
 *
 * It states nothing on its own: it decorates a control that already carries a
 * label and its own selected state, so screen readers see the control, not the
 * ornament.
 */
export function Reticle({
  active = false,
  children,
  className = "",
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
}) {
  // Brackets sit outside the box at rest and pull flush when locked on.
  const inset = active ? "0px" : "5px";
  const arm = active ? "11px" : "6px";
  const line = active ? "var(--color-purple-bright)" : "color-mix(in oklab, var(--color-bone) 22%, transparent)";

  const corner = (v: string, h: string) => ({
    [v]: inset,
    [h]: inset,
    width: arm,
    height: arm,
    borderColor: line,
    transition:
      "top 420ms var(--ease-out-expo), bottom 420ms var(--ease-out-expo), left 420ms var(--ease-out-expo), right 420ms var(--ease-out-expo), width 420ms var(--ease-out-expo), height 420ms var(--ease-out-expo), border-color 300ms linear",
  }) as React.CSSProperties;

  return (
    <span className={`group/ret relative inline-flex ${className}`}>
      {/* The bloom. Faint on purpose — the frame does the talking. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0,
          background:
            "radial-gradient(60% 60% at 50% 50%, color-mix(in oklab, var(--color-purple) 34%, transparent), transparent 72%)",
        }}
      />

      {/* Four brackets. They converge; they do not merely light up. */}
      <span aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute border-l border-t" style={corner("top", "left")} />
        <span className="absolute border-r border-t" style={corner("top", "right")} />
        <span className="absolute border-b border-l" style={corner("bottom", "left")} />
        <span className="absolute border-b border-r" style={corner("bottom", "right")} />
      </span>

      <span className="relative">{children}</span>
    </span>
  );
}
