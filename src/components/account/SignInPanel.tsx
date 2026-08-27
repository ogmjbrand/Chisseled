"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sign in, built on the light-spill login reference.
 *
 * The reference is a desk lamp: pull the cord, a warm pool of light falls
 * across the panel, and the form is readable only where the light reaches.
 * Two things about it are worth taking and one is worth refusing.
 *
 * Worth taking — the light has a *position* and a falloff. It is not a glow
 * applied evenly to a card; it comes from somewhere, and what is near it is
 * brighter than what is far from it. That is what makes the reference read as
 * a room rather than a gradient.
 *
 * Worth taking — the light *moves*, and movement is what draws the eye.
 *
 * Worth refusing — gating legibility on the light. In the reference the form
 * is genuinely unreadable until you find the cord. That is a puzzle, not an
 * interface, and on a sign-in screen it is the worst possible place for one.
 *
 * So the light is given a job instead of a gimmick: it follows the focused
 * field. On a dark panel, field borders are quiet by design, and "which box am
 * I typing in" is the one question the form has to answer instantly. The spill
 * answers it with the reference's own mechanic — a positioned light that
 * brightens what it lands on.
 *
 * It is strictly additive. Every field keeps its own border focus state, so
 * focus is never signalled by the spill alone, and the panel is fully legible
 * before hydration, with JavaScript off, and under reduced motion — where the
 * light stops travelling and simply appears.
 */

interface Field {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
}

const FIELDS: Field[] = [
  { id: "account-email", label: "Email", type: "email", autoComplete: "email" },
  { id: "account-password", label: "Password", type: "password", autoComplete: "current-password" },
];

/** Where the light rests when nothing is focused: above the panel, off-centre. */
const REST = { x: 34, y: -6 };

export function SignInPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [spill, setSpill] = useState(REST);
  const [lit, setLit] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  // The light lands on the centre of whatever has focus, in panel-relative
  // percentages so it survives resize without a listener.
  const moveTo = useCallback((el: HTMLElement) => {
    const panel = panelRef.current;
    if (!panel) return;
    const p = panel.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    if (!p.width || !p.height) return;
    setSpill({
      x: ((r.left + r.width / 2 - p.left) / p.width) * 100,
      y: ((r.top + r.height / 2 - p.top) / p.height) * 100,
    });
    setLit(true);
  }, []);

  const release = useCallback(() => {
    setSpill(REST);
    setLit(false);
  }, []);

  return (
    <div
      ref={panelRef}
      className="relative isolate overflow-hidden border border-bone/10 bg-carbon p-7"
    >
      {/* The spill. Sits behind the form, never over it, so nothing it does can
          reduce the contrast of the text it is meant to help you read. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10"
        style={{
          left: `${spill.x}%`,
          top: `${spill.y}%`,
          width: "26rem",
          height: "26rem",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--color-purple-bright) 30%, transparent), color-mix(in oklab, var(--color-purple) 14%, transparent) 46%, transparent 78%)",
          opacity: lit ? 1 : 0.5,
          transition: reduced
            ? "opacity 160ms linear"
            : "left 620ms var(--ease-out-expo), top 620ms var(--ease-out-expo), opacity 420ms linear",
        }}
      />

      <h2 className="display-sm mb-6 text-bone">Sign in</h2>

      <form className="space-y-4">
        {FIELDS.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className="eyebrow mb-2 block">
              {f.label}
            </label>
            <input
              id={f.id}
              type={f.type}
              autoComplete={f.autoComplete}
              required
              className="field"
              onFocus={(e) => moveTo(e.currentTarget)}
              onBlur={release}
            />
          </div>
        ))}

        <button
          type="submit"
          className="btn btn-primary btn-block"
          onFocus={(e) => moveTo(e.currentTarget)}
          onBlur={release}
        >
          Sign in
        </button>
      </form>

      <p className="mt-5 text-caption text-smoke">
        New here?{" "}
        <Link href="#signin" className="link-rule text-bone">
          Create an account
        </Link>
      </p>

      <p className="mt-6 border-t border-bone/10 pt-5 text-micro leading-relaxed text-ash">
        Demonstration storefront — authentication is not connected. Guest checkout works
        throughout without an account.
      </p>
    </div>
  );
}
