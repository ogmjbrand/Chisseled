"use client";

import Link from "next/link";
import { useState } from "react";
import { PROGRAMS } from "@/lib/catalog";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

/**
 * A working preview of the training product rather than a picture of one.
 * The tabs, the week selector and the session list all respond, because a
 * static screenshot of a dashboard reads as a mockup and this should not.
 */

const TABS = ["Today", "Programme", "Progress"] as const;
type Tab = (typeof TABS)[number];

const SESSION = [
  { name: "Back Squat", scheme: "5 × 3 @ 82%", done: true, note: "Last: 112.5kg × 3" },
  { name: "Romanian Deadlift", scheme: "3 × 8 @ RIR 2", done: true, note: "Last: 90kg × 8" },
  { name: "Walking Lunge", scheme: "3 × 10 / leg", done: false, note: "Last: 22kg × 10" },
  { name: "Standing Calf Raise", scheme: "4 × 12", done: false, note: "Last: 60kg × 12" },
  { name: "Hanging Leg Raise", scheme: "3 × max", done: false, note: "Last: 3 × 14" },
];

const WEEKS = [
  { w: 1, load: 62, block: "Volume" },
  { w: 2, load: 71, block: "Volume" },
  { w: 3, load: 78, block: "Volume" },
  { w: 4, load: 84, block: "Volume" },
  { w: 5, load: 58, block: "Deload" },
  { w: 6, load: 82, block: "Intensity" },
  { w: 7, load: 88, block: "Intensity" },
  { w: 8, load: 94, block: "Intensity" },
  { w: 9, load: 100, block: "Realise" },
];

const METRICS = [
  { label: "Est. 1RM Squat", value: "142", unit: "kg", delta: "+8.5" },
  { label: "Weekly tonnage", value: "24.8", unit: "t", delta: "+2.1" },
  { label: "Sessions logged", value: "47", unit: "", delta: "of 48" },
  { label: "Avg. RIR", value: "1.8", unit: "", delta: "on target" },
];

export function TrainingPlatform() {
  const [tab, setTab] = useState<Tab>("Today");
  const [checked, setChecked] = useState<Set<number>>(
    () => new Set(SESSION.flatMap((s, i) => (s.done ? [i] : []))),
  );

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const completion = Math.round((checked.size / SESSION.length) * 100);

  return (
    <section
      id="platform"
      className="relative border-t border-bone/10 bg-ink section-pad"
      aria-labelledby="platform-heading"
    >
      <div className="shell">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="eyebrow mb-5">07 — The Platform</p>
            <h2 id="platform-heading" className="display-lg mb-5 max-w-[15ch] text-bone" data-reveal>
              Training, measured.
            </h2>
            <p
              className="lede max-w-[52ch]"
              data-reveal
              style={{ "--reveal-delay": "90ms" } as React.CSSProperties}
            >
              Log the work, and the programme reads it. Volume moves with the effort you
              actually reported — not with a spreadsheet written before your week happened.
            </p>
          </div>

          <Link href="/train" className="btn btn-purple justify-self-start lg:justify-self-end">
            Start training
            <ArrowMark className="size-4" />
          </Link>
        </div>

        {/* --- The application --- */}
        <div
          className="glass-black relative overflow-hidden shadow-[var(--shadow-panel)]"
          data-reveal
        >
          <span aria-hidden className="metal-edge-line" />

          {/* Chrome */}
          <div className="flex items-center justify-between border-b border-bone/10 px-5 py-3.5">
            <div className="flex items-center gap-3">
              <span className="flex gap-1.5" aria-hidden>
                {["bg-iron", "bg-iron", "bg-purple/60"].map((c, i) => (
                  <span key={i} className={`size-2 rounded-full ${c}`} />
                ))}
              </span>
              <span className="font-mono text-micro uppercase tracking-[0.16em] text-smoke">
                Chisseled Training — Peak 16 · Week 8
              </span>
            </div>

            <div role="tablist" aria-label="Dashboard view" className="flex gap-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  aria-controls={`panel-${t}`}
                  id={`tab-${t}`}
                  onClick={() => setTab(t)}
                  className={[
                    "px-3 py-1.5 font-mono text-micro uppercase tracking-[0.14em] transition-colors duration-300",
                    tab === t ? "bg-bone text-ink" : "text-smoke hover:text-bone",
                  ].join(" ")}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Panels */}
          <div className="grid gap-px bg-bone/8 lg:grid-cols-[1.6fr_1fr]">
            {/* Left — the working area */}
            <div
              role="tabpanel"
              id={`panel-${tab}`}
              aria-labelledby={`tab-${tab}`}
              className="bg-carbon p-6 lg:p-8"
            >
              {tab === "Today" && (
                <>
                  <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                      <p className="eyebrow mb-2">Thursday — Lower, Heavy</p>
                      <p className="display-sm text-bone">Session 4 of 4</p>
                    </div>
                    <div className="text-right">
                      <p className="numeric text-h4 text-purple-bright">{completion}%</p>
                      <p className="eyebrow mt-1">Complete</p>
                    </div>
                  </div>

                  <div className="mb-6 h-0.5 w-full overflow-hidden bg-bone/10">
                    <div
                      className="h-full bg-purple-bright transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                      style={{ width: `${completion}%` }}
                    />
                  </div>

                  <ul className="divide-y divide-bone/8">
                    {SESSION.map((ex, i) => {
                      const done = checked.has(i);
                      return (
                        <li key={ex.name}>
                          <button
                            type="button"
                            onClick={() => toggle(i)}
                            aria-pressed={done}
                            className="flex w-full items-center gap-4 py-3.5 text-left transition-opacity duration-300"
                          >
                            <span
                              className={[
                                "flex size-5 shrink-0 items-center justify-center border transition-colors duration-300",
                                done
                                  ? "border-purple bg-purple text-bone"
                                  : "border-bone/25 text-transparent",
                              ].join(" ")}
                            >
                              <CheckMark className="size-3.5" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span
                                className={[
                                  "block text-body-sm transition-colors duration-300",
                                  done ? "text-smoke line-through" : "text-bone",
                                ].join(" ")}
                              >
                                {ex.name}
                              </span>
                              <span className="numeric block text-micro text-ash">{ex.note}</span>
                            </span>

                            <span className="numeric shrink-0 font-mono text-caption text-fog">
                              {ex.scheme}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {tab === "Programme" && (
                <>
                  <p className="eyebrow mb-2">Peak 16 — Load progression</p>
                  <p className="display-sm mb-7 text-bone">Sixteen weeks, one number.</p>

                  <div className="flex h-40 items-end gap-1.5" role="img" aria-label="Weekly training load, climbing from 62 to 100 percent across nine weeks with a deload in week five.">
                    {WEEKS.map((w) => (
                      <div key={w.w} className="group flex flex-1 flex-col items-center gap-2">
                        <div className="relative flex w-full flex-1 items-end">
                          <div
                            className={[
                              "w-full transition-all duration-700 ease-[var(--ease-out-expo)]",
                              w.block === "Deload"
                                ? "bg-iron"
                                : w.w === 8
                                  ? "bg-purple-bright"
                                  : "bg-bone/30 group-hover:bg-bone/50",
                            ].join(" ")}
                            style={{ height: `${w.load}%` }}
                          />
                        </div>
                        <span className="numeric text-[0.5625rem] text-ash">{w.w}</span>
                      </div>
                    ))}
                  </div>

                  <ul className="mt-7 grid grid-cols-3 gap-px border border-bone/10 bg-bone/10">
                    {["Volume", "Intensity", "Realise"].map((b) => (
                      <li key={b} className="bg-carbon p-4">
                        <p className="font-display text-h6 font-bold uppercase text-bone">{b}</p>
                        <p className="mt-1 text-micro text-smoke">
                          {b === "Volume"
                            ? "Weeks 1–6"
                            : b === "Intensity"
                              ? "Weeks 7–12"
                              : "Weeks 13–16"}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {tab === "Progress" && (
                <>
                  <p className="eyebrow mb-2">Rolling 12 weeks</p>
                  <p className="display-sm mb-7 text-bone">The numbers are moving.</p>

                  <ul className="grid grid-cols-2 gap-px border border-bone/10 bg-bone/10">
                    {METRICS.map((m) => (
                      <li key={m.label} className="bg-carbon p-5">
                        <p className="eyebrow mb-3">{m.label}</p>
                        <p className="flex items-baseline gap-1">
                          <span className="numeric text-h3 text-bone">{m.value}</span>
                          <span className="numeric text-caption text-smoke">{m.unit}</span>
                        </p>
                        <p className="numeric mt-1.5 text-micro text-purple-bright">{m.delta}</p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {/* Right — the persistent rail */}
            <aside className="bg-ink p-6 lg:p-8">
              <p className="eyebrow mb-5">Your programmes</p>
              <ul className="mb-8 space-y-2.5">
                {PROGRAMS.slice(0, 3).map((p, i) => (
                  <li
                    key={p.slug}
                    className={[
                      "border p-3.5 transition-colors duration-400",
                      i === 0 ? "border-purple/40 bg-purple/8" : "border-bone/10",
                    ].join(" ")}
                  >
                    <p className="text-caption font-medium text-bone">{p.name}</p>
                    <p className="mt-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-smoke">
                      {p.discipline} · {p.weeks} wks · {p.level}
                    </p>
                    {i === 0 && (
                      <div className="mt-2.5 h-px w-full bg-bone/10">
                        <div className="h-full w-[47%] bg-purple-bright" />
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              <p className="eyebrow mb-4">Active challenge</p>
              <div className="border border-bone/10 p-4">
                <p className="text-caption text-bone">100 Sessions, 100 Days</p>
                <p className="numeric mt-2 text-h4 text-bone">
                  47<span className="text-caption text-ash">/100</span>
                </p>
                <p className="mt-2 text-micro text-smoke">
                  You&apos;re in the top 12% of participants.
                </p>
              </div>

              <p className="mt-8 text-micro leading-relaxed text-ash">
                Preview shown with sample data. Your dashboard reflects your own logged
                sessions.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
