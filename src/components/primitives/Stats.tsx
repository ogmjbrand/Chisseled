"use client";

import { useId, useState } from "react";

/**
 * Training data marks, built on the fitness-app reference.
 *
 * The reference leads with a circular progress ring. That form is a two-slice
 * donut, and for "a single ratio against a limit" the right form is a meter on
 * the same ramp — the ring is app decoration, and the mechanic worth keeping is
 * the one underneath it: the number is the hero, the goal is stated in words,
 * and the track shows how far along it sits. So Meter keeps the mechanic and
 * drops the donut.
 *
 * Colour is settled by measurement, not taste. On the carbon card surface
 * (#0f0f12) the brand purple #9630fc reaches 3.76:1 — over the 3:1 a data mark
 * needs, so unlike the violet it replaces it would now be legal here. The
 * bright step still carries the marks at 5.73:1, because a chart wants headroom
 * rather than the minimum, and because the brand colour reads as a surface
 * everywhere else on the site and should not start meaning "data" on one card.
 * The ramp is lightness-monotonic, which is the correct check for a single hue.
 */

/** The one colour a data mark may wear on a dark card. */
const MARK = "#b268fd";
/** Recessive track, one step off the surface. */
const TRACK = "rgba(178,104,253,0.16)";

/* ==================================================================
   METER — a single ratio against a limit
   ================================================================== */

export function Meter({
  value,
  goal,
  unit,
  label,
  caption,
}: {
  value: number;
  goal: number;
  unit?: string;
  label: string;
  caption?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / goal) * 100)));

  return (
    <div>
      <p className="eyebrow mb-3">{label}</p>

      {/* Hero figure. The number is the point; the track only locates it. */}
      <p className="numeric text-bone" style={{ fontSize: "clamp(2.75rem,5vw,3.5rem)", lineHeight: 1 }}>
        {value.toLocaleString()}
        {unit && <span className="ml-1.5 text-h6 text-smoke">{unit}</span>}
      </p>

      <div
        className="mt-5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: TRACK }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-label={`${label}: ${value} of ${goal}${unit ? ` ${unit}` : ""}`}
      >
        <div
          className="h-full rounded-full transition-[width] duration-[900ms] ease-[var(--ease-out-expo)]"
          style={{ width: `${pct}%`, background: MARK }}
        />
      </div>

      <p className="mt-3 text-caption text-smoke">
        {caption ?? (
          <>
            {pct}% of {goal.toLocaleString()}
            {unit ? ` ${unit}` : ""} target
          </>
        )}
      </p>
    </div>
  );
}

/* ==================================================================
   WEEK BARS — magnitude over seven days
   ================================================================== */

export interface DayValue {
  day: string;
  value: number;
  /** The day being reported. Gets the only direct label. */
  today?: boolean;
}

export function WeekBars({
  data,
  unit = "min",
  label,
}: {
  data: DayValue[];
  unit?: string;
  label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const uid = useId();
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <figure className="m-0">
      <figcaption className="eyebrow mb-4">{label}</figcaption>

      {/* One baseline, bars grow from it. Gap between bars is surface, not a
          stroke — separation by negative space. */}
      <div className="relative flex h-28 items-end gap-[2px]">
        {data.map((d, i) => {
          const h = Math.max(3, (d.value / max) * 100);
          const active = hover === i;
          return (
            <button
              key={d.day + i}
              type="button"
              className="group relative flex h-full flex-1 cursor-default items-end focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-bright"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-describedby={`${uid}-tip`}
              aria-label={`${d.day}: ${d.value} ${unit}`}
            >
              <span
                className="w-full transition-opacity duration-300"
                style={{
                  height: `${h}%`,
                  maxWidth: 24,
                  margin: "0 auto",
                  background: MARK,
                  // 4px rounded data-end, square at the baseline.
                  borderRadius: "4px 4px 0 0",
                  opacity: hover === null ? (d.today ? 1 : 0.55) : active ? 1 : 0.35,
                }}
              />
            </button>
          );
        })}

        {/* Tooltip. A chart in the DOM is interactive; it ships with hover. */}
        {hover !== null && (
          <div
            id={`${uid}-tip`}
            role="status"
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap border border-bone/15 bg-ink px-3 py-1.5"
          >
            <span className="numeric text-caption text-bone">
              {data[hover].value} {unit}
            </span>
            <span className="ml-2 text-caption text-smoke">{data[hover].day}</span>
          </div>
        )}
      </div>

      {/* Axis: recessive, hairline, solid. */}
      <div className="mt-2 h-px w-full bg-bone/10" />

      <div className="mt-2 flex gap-[2px]">
        {data.map((d, i) => (
          <span
            key={d.day + i}
            className={[
              "flex-1 text-center font-mono text-micro uppercase tracking-[0.14em]",
              d.today ? "text-bone" : "text-ash",
            ].join(" ")}
          >
            {d.day}
          </span>
        ))}
      </div>

      {/* Label selectively: only the day being reported carries a value. */}
      {data.find((d) => d.today) && (
        <p className="mt-3 text-caption text-smoke">
          Today —{" "}
          <span className="numeric text-bone">
            {data.find((d) => d.today)!.value} {unit}
          </span>
        </p>
      )}
    </figure>
  );
}

/* ==================================================================
   META PILLS — the reference's compact session metadata
   ================================================================== */

export function MetaPills({ items }: { items: { icon?: React.ReactNode; text: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((it) => (
        <li
          key={it.text}
          className="inline-flex items-center gap-1.5 border border-bone/12 bg-bone/[0.04] px-2.5 py-1 font-mono text-micro uppercase tracking-[0.12em] text-fog"
        >
          {it.icon}
          {it.text}
        </li>
      ))}
    </ul>
  );
}
