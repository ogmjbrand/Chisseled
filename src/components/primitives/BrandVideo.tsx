"use client";

import { useEffect, useRef, useState } from "react";
import { film, type FilmRole } from "@/lib/video";

interface BrandVideoProps {
  role: FilmRole;
  /**
   * `cover` fills the frame and crops — only sound where the container
   * matches the clip's aspect. `contain` shows the whole frame.
   */
  fit?: "cover" | "contain";
  /**
   * `signal`/`deep` keep the source colour and add a purple rim.
   * `purple` is a true duotone: the clip is desaturated first, then tinted,
   * so whatever hue the source carries it resolves to brand purple — a red
   * or magenta source cannot come through the tint reading pink.
   */
  grade?: "signal" | "deep" | "purple" | "none";
  /** Start paused until scrolled into view. Off for the hero. */
  lazy?: boolean;
  loop?: boolean;
  /** Fires once the clip reaches its end. Used by the order confirmation. */
  onEnded?: () => void;
  /** Fires if the clip cannot be loaded or decoded at all. */
  onError?: () => void;
  className?: string;
}

/**
 * Brand film playback.
 *
 * Muted, inline and autoplaying, because these are motion design rather than
 * content anyone chose to watch — and for the same reason, a viewer who has
 * asked for reduced motion gets a still first frame and a control instead of
 * a moving background they did not ask for.
 */
export function BrandVideo({
  role,
  fit = "cover",
  grade = "signal",
  lazy = true,
  loop = true,
  onEnded,
  onError,
  className = "",
}: BrandVideoProps) {
  const f = film(role);
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  // Only spend decode budget on clips the viewer can actually see.
  useEffect(() => {
    const el = ref.current;
    if (!el || !lazy || reduced) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lazy, reduced]);

  return (
    <div className={`relative overflow-hidden bg-ink ${className}`}>
      <video
        ref={ref}
        src={`/media/video/${f.file}.mp4`}
        muted
        loop={loop}
        playsInline
        autoPlay={!lazy && !reduced}
        preload={lazy ? "metadata" : "auto"}
        controls={reduced}
        onEnded={onEnded}
        onError={onError}
        aria-label={f.description}
        style={grade === "purple" ? { filter: "grayscale(1) contrast(1.08) brightness(1.04)" } : undefined}
        className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"}`}
      />

      {grade === "purple" && (
        <>
          {/* The clip is greyscale underneath, so `color` sets the hue outright. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-purple"
            style={{ mixBlendMode: "color" }}
          />
          {/* Lifts the highlights toward bright purple so it reads lit, not flat. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-purple-bright"
            style={{ mixBlendMode: "overlay", opacity: 0.28 }}
          />
        </>
      )}

      {(grade === "signal" || grade === "deep") && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 90% at 82% 8%, color-mix(in oklab, var(--color-purple) 55%, transparent), transparent 62%)",
              mixBlendMode: "screen",
              opacity: grade === "deep" ? 0.46 : 0.3,
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, var(--color-ink) 4%, color-mix(in oklab, var(--color-ink) 72%, transparent) 32%, transparent 66%)",
              opacity: grade === "deep" ? 1 : 0.78,
            }}
          />
        </>
      )}
    </div>
  );
}
