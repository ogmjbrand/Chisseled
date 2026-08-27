"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Order confirmation celebration, built on the particle-fill reference.
 *
 * What the reference does, and what is reproduced:
 *   1. Particles rise from the bottom edge and accumulate until they fill the
 *      frame — the payoff is density arriving over a few seconds, not a burst.
 *   2. Scale, speed, drift and opacity all vary per particle, so it reads as a
 *      cloud rather than a grid.
 *   3. A short message sits centred and legible the whole way through, with
 *      the field building around it rather than over it.
 *
 * Differences, deliberately: the reference is pink hearts. This is CHISSELED's
 * chevron in brand purple, and the field stays behind a legibility scrim so
 * the confirmation copy never drops below contrast while the fill runs.
 *
 * Canvas rather than DOM nodes: a few hundred elements animating opacity and
 * transform would thrash layout on a mid-range phone right after checkout.
 */

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  phase: number;
  rot: number;
  spin: number;
  alpha: number;
  tint: number;
}

const COUNT = 260;
const FILL_MS = 5200;

/** The CHISSELED chevron, drawn as a path so it scales cleanly at any size. */
function chevron(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, -s * 0.62);
  ctx.lineTo(-s * 0.05, -s * 0.62);
  ctx.lineTo(s * 0.5, 0);
  ctx.lineTo(-s * 0.05, s * 0.62);
  ctx.lineTo(-s * 0.5, s * 0.62);
  ctx.lineTo(s * 0.0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function OrderCelebration({ onSettled }: { onSettled?: () => void } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    // Reduced motion gets the settled state immediately — no field, no wait.
    if (reduced) {
      onSettled?.();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const parts: Particle[] = Array.from({ length: COUNT }, () => ({
      x: rand(0, 1),
      // Staggered start below the fold so they arrive in waves.
      y: rand(1.02, 2.6),
      size: rand(8, 40),
      speed: rand(0.045, 0.14),
      drift: rand(-0.035, 0.035),
      phase: rand(0, Math.PI * 2),
      rot: rand(-0.5, 0.5),
      spin: rand(-0.22, 0.22),
      alpha: rand(0.22, 0.82),
      tint: Math.random(),
    }));

    let raf = 0;
    const t0 = performance.now();
    let settled = false;

    const frame = (now: number) => {
      const elapsed = now - t0;
      const dt = 1 / 60;
      ctx.clearRect(0, 0, w, h);

      for (const p of parts) {
        p.y -= p.speed * dt;
        p.x += Math.sin(now / 1000 + p.phase) * p.drift * dt;
        p.rot += p.spin * dt;
        // Once the field has filled, hold it rather than draining off the top.
        if (p.y < -0.12) p.y = 1.06;

        const px = p.x * w;
        const py = p.y * h;
        // Brand purple through bright purple, so the field has depth.
        const c = p.tint < 0.62 ? "109,40,217" : "139,92,246";
        ctx.fillStyle = `rgba(${c},${p.alpha})`;
        chevron(ctx, px, py, p.size, p.rot);
      }

      if (!settled && elapsed > FILL_MS) {
        settled = true;
        onSettled?.();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced, onSettled]);

  if (reduced) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
      {/* Keeps the confirmation copy above contrast while the field builds. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 38% at 50% 50%, var(--color-ink) 30%, color-mix(in oklab, var(--color-ink) 55%, transparent) 62%, transparent 100%)",
        }}
      />
    </>
  );
}
