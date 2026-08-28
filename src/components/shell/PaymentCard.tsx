"use client";

import { BrandMark } from "@/components/primitives/BrandMark";
import { useCallback, useEffect, useId, useState } from "react";

/**
 * Card details, built on the flip-card payment reference.
 *
 * The reference does two things worth taking, and both of them are teaching
 * rather than decoration:
 *
 *   1. The card face mirrors the fields live. You are copying sixteen digits
 *      off a physical card, and the preview is where you check you got them
 *      right — the same reason a bank app shows the number back to you.
 *
 *   2. Focusing the security code flips the card to its back. The CVC is
 *      physically on the back of the card in your hand, and the flip says so
 *      without a sentence of instruction. That is the whole point of it, and
 *      it is why this one survives the "is it decorative?" test.
 *
 * Rebuilt with CHISSELED's own material: brand purple through bright purple
 * rather than the reference's blue, the CH shield as the mark, and the site's
 * mono for the number so the digits sit on a fixed pitch and group cleanly.
 *
 * WHAT THIS DOES NOT DO. It takes no payment and sends nothing anywhere —
 * there is no backend in this build. Because of that the inputs deliberately
 * do NOT carry `cc-number` / `cc-csc` autocomplete hints: inviting a browser
 * to autofill somebody's real card into a demonstration form would be a bad
 * thing to do, however good the form looks. In production this component is
 * replaced by the provider's hosted fields, which is the only correct way to
 * touch a real card number.
 */

const MAX_DIGITS = 16;

/** Digits only, grouped in fours — how the number reads on the card itself. */
function groupDigits(raw: string) {
  return (raw.match(/.{1,4}/g) ?? []).join(" ");
}

/** The unfilled slots stay visible so the shape of the number is legible. */
function maskedNumber(raw: string) {
  const filled = raw.padEnd(MAX_DIGITS, "•").slice(0, MAX_DIGITS);
  return groupDigits(filled);
}

export function PaymentCard() {
  const uid = useId();
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [flipped, setFlipped] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(q.matches);
    sync();
    q.addEventListener("change", sync);
    return () => q.removeEventListener("change", sync);
  }, []);

  const digits = useCallback(
    (v: string, max: number) => v.replace(/\D/g, "").slice(0, max),
    [],
  );

  const face = (
    <>
      {/* Chip and mark */}
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="block h-7 w-10 rounded-[5px] border border-bone/25"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in oklab, var(--color-bone) 62%, transparent), color-mix(in oklab, var(--color-bone) 22%, transparent))",
          }}
        />
        {/* The shield is keyed on its own luminance, so it composites with
            plain alpha — no blend mode needed to hide the black it ships on. */}
        <BrandMark tone="colour" className="h-9 w-auto" />
      </div>

      {/* The number.
          Sized against the CARD, not the viewport. A vw-based clamp read 4.4vw
          = 63px inside a 352px card on a 1440px screen and wrapped the number
          onto two lines, which is the one thing a card number must never do.
          `cqi` resolves against the card's own inline size, so the digits fit
          at every width the card is drawn at. */}
      <p
        className="numeric mt-auto whitespace-nowrap tracking-[0.14em] text-bone"
        // Measured, not guessed: at this face the string costs 13.84px of
        // width per 1px of font-size, and the card's padding leaves
        // (width - 48px). 5.4cqi keeps it on one line from a 238px card up,
        // with ~5% to spare at the tightest. `nowrap` is the guarantee — a
        // card number broken across two lines is unreadable as a number.
        style={{ fontSize: "clamp(0.7rem, 5.4cqi, 1.375rem)" }}
      >
        {maskedNumber(number)}
      </p>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-bone/55">
            Card holder
          </p>
          <p className="truncate font-mono text-caption uppercase tracking-[0.08em] text-bone">
            {name || "YOUR NAME"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[0.5rem] uppercase tracking-[0.18em] text-bone/55">
            Expires
          </p>
          <p className="numeric text-caption text-bone">
            {month || "MM"}/{year || "YY"}
          </p>
        </div>
      </div>
    </>
  );

  const back = (
    <>
      {/* Magnetic stripe */}
      <div aria-hidden className="-mx-6 h-11 bg-black/85" />
      <div className="mt-6">
        <p className="mb-1.5 text-right font-mono text-[0.5rem] uppercase tracking-[0.18em] text-bone/55">
          Security code
        </p>
        <div className="ml-auto flex h-9 w-24 items-center justify-end rounded-[3px] bg-bone px-3">
          <span className="numeric text-caption tracking-[0.3em] text-ink">
            {cvc ? "•".repeat(cvc.length) : "•••"}
          </span>
        </div>
      </div>
      <p className="mt-auto text-[0.5rem] leading-relaxed text-bone/45">
        The three digits printed on the signature strip.
      </p>
    </>
  );

  return (
    <div className="mt-6">
      {/* ---------------- The card ----------------
          A visual echo of the fields below it, so it is hidden from assistive
          technology: the inputs already say everything it shows. */}
      <div
        aria-hidden
        className="mx-auto w-full max-w-[22rem]"
        style={{ perspective: reduced ? undefined : "1100px" }}
      >
        <div
          className="relative aspect-[1.586/1] w-full"
          style={{
            containerType: "inline-size",
            transformStyle: reduced ? undefined : "preserve-3d",
            transform: reduced || !flipped ? undefined : "rotateY(180deg)",
            transition: reduced ? undefined : "transform 700ms var(--ease-out-expo)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-bone/12 p-6"
            style={{
              backfaceVisibility: "hidden",
              background:
                "linear-gradient(140deg, var(--color-purple) 0%, var(--color-purple-dim) 46%, var(--color-carbon) 100%)",
              // Under reduced motion there is no flip, so the two faces swap.
              opacity: reduced && flipped ? 0 : 1,
              transition: reduced ? "opacity 200ms linear" : undefined,
            }}
          >
            {face}
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-bone/12 py-6 pl-6 pr-6"
            style={{
              backfaceVisibility: "hidden",
              transform: reduced ? undefined : "rotateY(180deg)",
              background:
                "linear-gradient(140deg, var(--color-purple-dim) 0%, var(--color-carbon) 70%)",
              opacity: reduced && !flipped ? 0 : 1,
              transition: reduced ? "opacity 200ms linear" : undefined,
            }}
          >
            {back}
          </div>
        </div>
      </div>

      {/* ---------------- The fields ---------------- */}
      <div className="mt-7 space-y-4">
        <div>
          <label htmlFor={`${uid}-num`} className="eyebrow mb-2 block">
            Card number
          </label>
          <input
            id={`${uid}-num`}
            className="field numeric tracking-[0.12em]"
            inputMode="numeric"
            autoComplete="off"
            placeholder="0000 0000 0000 0000"
            value={groupDigits(number)}
            onChange={(e) => setNumber(digits(e.target.value, MAX_DIGITS))}
            onFocus={() => setFlipped(false)}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-name`} className="eyebrow mb-2 block">
            Name on card
          </label>
          <input
            id={`${uid}-name`}
            className="field uppercase"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 26))}
            onFocus={() => setFlipped(false)}
          />
        </div>

        <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-3">
          <div>
            <label htmlFor={`${uid}-mm`} className="eyebrow mb-2 block">
              Month
            </label>
            <input
              id={`${uid}-mm`}
              className="field numeric"
              inputMode="numeric"
              autoComplete="off"
              placeholder="MM"
              value={month}
              onChange={(e) => setMonth(digits(e.target.value, 2))}
              onFocus={() => setFlipped(false)}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-yy`} className="eyebrow mb-2 block">
              Year
            </label>
            <input
              id={`${uid}-yy`}
              className="field numeric"
              inputMode="numeric"
              autoComplete="off"
              placeholder="YY"
              value={year}
              onChange={(e) => setYear(digits(e.target.value, 2))}
              onFocus={() => setFlipped(false)}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-cvc`} className="eyebrow mb-2 block">
              Security code
            </label>
            <input
              id={`${uid}-cvc`}
              className="field numeric"
              inputMode="numeric"
              autoComplete="off"
              placeholder="CVC"
              value={cvc}
              onChange={(e) => setCvc(digits(e.target.value, 4))}
              // The reason the card turns over. Keyboard focus drives it too,
              // so tabbing here shows the back exactly as clicking does.
              onFocus={() => setFlipped(true)}
              onBlur={() => setFlipped(false)}
              aria-describedby={`${uid}-cvc-hint`}
            />
          </div>
        </div>

        <p id={`${uid}-cvc-hint`} className="text-micro leading-relaxed text-ash">
          The security code is the three digits on the back of the card. This is a
          demonstration form — nothing is sent anywhere, and no payment is taken.
        </p>
      </div>
    </div>
  );
}
