"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PRODUCTS, PROGRAMS } from "@/lib/catalog";
import { ProductCard } from "@/components/product/ProductCard";
import { Specimen } from "@/components/primitives/Visual";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";
import type { Activity, Fit, Product, Program } from "@/lib/types";

/**
 * FIND YOUR PERFORMANCE FIT
 * ------------------------------------------------------------------
 * Five questions, scored rather than branched. Every answer adds weight
 * to products and programmes; the recommendation is whatever accumulates
 * the most. Scoring beats branching here because it degrades gracefully —
 * an unusual combination of answers still produces a sensible result
 * instead of falling off the end of a decision tree.
 */

interface Option {
  id: string;
  label: string;
  note: string;
  /** Weights applied when this option is chosen. */
  activities?: Activity[];
  fits?: Fit[];
  worlds?: Product["world"][];
  disciplines?: string[];
  levels?: Program["level"][];
  categories?: string[];
}

interface Question {
  id: string;
  prompt: string;
  helper: string;
  multi?: boolean;
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "train-for",
    prompt: "What do you train for?",
    helper: "Pick the one that describes most of your week.",
    options: [
      {
        id: "strength",
        label: "Getting stronger",
        note: "Barbell work, progressive overload, numbers going up.",
        activities: ["lifting"],
        disciplines: ["Strength"],
        categories: ["Compression", "Shorts"],
      },
      {
        id: "physique",
        label: "Building the physique",
        note: "Volume, hypertrophy, proximity to failure.",
        activities: ["lifting", "training"],
        disciplines: ["Physique"],
        categories: ["Tops", "Leggings"],
      },
      {
        id: "engine",
        label: "Building the engine",
        note: "Running, rowing, conditioning, aerobic base.",
        activities: ["running", "training"],
        disciplines: ["Conditioning"],
        categories: ["Shorts", "Compression"],
      },
      {
        id: "general",
        label: "Feeling good in a real life",
        note: "Three sessions a week that fit around everything else.",
        activities: ["everyday", "training"],
        disciplines: ["General", "Mobility & Recovery"],
        categories: ["Tops", "Outerwear"],
      },
    ],
  },
  {
    id: "wear",
    prompt: "What do you actually wear to train?",
    helper: "Choose as many as apply.",
    multi: true,
    options: [
      { id: "leggings", label: "Leggings", note: "Full length, every session.", categories: ["Leggings"], worlds: ["women"] },
      { id: "shorts", label: "Shorts", note: "Whatever the weather is doing.", categories: ["Shorts"] },
      { id: "tops", label: "Tees & tanks", note: "A layer, not a statement.", categories: ["Tops"] },
      { id: "compression", label: "Compression", note: "Under everything, or on its own.", categories: ["Compression"], fits: ["compression"] },
    ],
  },
  {
    id: "fit",
    prompt: "How should it fit?",
    helper: "There is no right answer here — only yours.",
    options: [
      { id: "compression", label: "Locked down", note: "Second skin. You want to feel held.", fits: ["compression", "sculpt"] },
      { id: "regular", label: "Close but easy", note: "Follows the body without gripping it.", fits: ["regular", "sculpt"] },
      { id: "relaxed", label: "Room to move", note: "Nothing touching you mid-set.", fits: ["relaxed"] },
      { id: "oversized", label: "Deliberately loose", note: "Drape is the point.", fits: ["oversized", "relaxed"] },
    ],
  },
  {
    id: "experience",
    prompt: "How long have you been training?",
    helper: "Honestly. It changes what we recommend.",
    options: [
      { id: "new", label: "Under a year", note: "Or coming back after a long break.", levels: ["Foundation"] },
      { id: "some", label: "One to three years", note: "The lifts feel familiar now.", levels: ["Foundation", "Intermediate"] },
      { id: "experienced", label: "Three to eight years", note: "You know what a hard set feels like.", levels: ["Intermediate", "Advanced"] },
      { id: "long", label: "Eight years or more", note: "You have opinions about programming.", levels: ["Advanced", "Intermediate"] },
    ],
  },
  {
    id: "goal",
    prompt: "What's actually holding you back?",
    helper: "Choose as many as apply.",
    multi: true,
    options: [
      { id: "consistency", label: "Consistency", note: "The programme is fine. Showing up is the problem.", disciplines: ["General"], levels: ["Foundation"] },
      { id: "recovery", label: "Recovery", note: "Something always hurts, or sleep is the weak link.", activities: ["recovery"], disciplines: ["Mobility & Recovery"], categories: ["Recovery"] },
      { id: "nutrition", label: "Nutrition", note: "The training is there, the eating is not.", worlds: ["performance"], categories: ["Protein", "Daily Essentials"] },
      { id: "plateau", label: "A plateau", note: "The numbers have not moved in months.", disciplines: ["Strength", "Physique"], levels: ["Intermediate", "Advanced"] },
    ],
  },
];

type Answers = Record<string, string[]>;

export function FitQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [done, setDone] = useState(false);

  const question = QUESTIONS[step];
  const selected = answers[question?.id] ?? [];
  const progress = ((step + (done ? 1 : 0)) / QUESTIONS.length) * 100;

  const choose = (optionId: string) => {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.multi) {
        return {
          ...prev,
          [question.id]: current.includes(optionId)
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [question.id]: [optionId] };
    });

    // Single-answer questions advance on their own; multi waits for Continue.
    if (!question.multi) {
      window.setTimeout(() => {
        if (step === QUESTIONS.length - 1) setDone(true);
        else setStep((s) => s + 1);
      }, 260);
    }
  };

  const advance = () => {
    if (step === QUESTIONS.length - 1) setDone(true);
    else setStep((s) => s + 1);
  };

  const result = useMemo(() => (done ? score(answers) : null), [done, answers]);

  if (done && result) {
    return (
      <Result
        result={result}
        onRestart={() => {
          setAnswers({});
          setStep(0);
          setDone(false);
        }}
      />
    );
  }

  return (
    <div className="shell max-w-[52rem] pb-24 pt-[calc(var(--nav-h)+3rem)]">
      {/* Progress */}
      <div className="mb-12">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="eyebrow">
            Question {step + 1} of {QUESTIONS.length}
          </p>
          <p className="numeric text-micro text-ash">{Math.round(progress)}%</p>
        </div>
        <div
          className="h-px w-full overflow-hidden bg-bone/12"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Quiz progress"
        >
          <div
            className="h-full bg-emerald-bright transition-[width] duration-700 ease-[var(--ease-out-expo)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <fieldset key={question.id} className="animate-rise">
        <legend className="display-md mb-4 text-bone">{question.prompt}</legend>
        <p className="mb-10 text-body text-smoke">{question.helper}</p>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {question.options.map((opt) => {
            const on = selected.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => choose(opt.id)}
                aria-pressed={on}
                className={[
                  "group relative border p-6 text-left transition-all duration-400",
                  on
                    ? "border-emerald bg-emerald/8"
                    : "border-bone/15 bg-carbon hover:border-bone/40",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute right-5 top-5 flex size-5 items-center justify-center border transition-colors duration-300",
                    on ? "border-emerald bg-emerald text-ink" : "border-bone/25 text-transparent",
                  ].join(" ")}
                  aria-hidden
                >
                  <CheckMark className="size-3.5" />
                </span>

                <span className="block pr-8 font-display text-h6 font-bold uppercase leading-tight tracking-tight text-bone">
                  {opt.label}
                </span>
                <span className="mt-2 block text-body-sm leading-relaxed text-smoke">
                  {opt.note}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="font-mono text-label uppercase tracking-[0.18em] text-ash transition-colors hover:text-bone disabled:pointer-events-none disabled:opacity-30"
        >
          Back
        </button>

        {question.multi && (
          <button
            type="button"
            onClick={advance}
            disabled={selected.length === 0}
            className="btn btn-primary"
          >
            {step === QUESTIONS.length - 1 ? "See my results" : "Continue"}
            <ArrowMark className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ==================================================================
   SCORING
   ================================================================== */

interface ScoreResult {
  products: Product[];
  programme: Program;
  fit: Fit;
  summary: string;
}

function score(answers: Answers): ScoreResult {
  const productScores = new Map<string, number>();
  const programScores = new Map<string, number>();
  const fitVotes = new Map<Fit, number>();

  for (const question of QUESTIONS) {
    const chosen = answers[question.id] ?? [];

    for (const optionId of chosen) {
      const opt = question.options.find((o) => o.id === optionId);
      if (!opt) continue;

      for (const f of opt.fits ?? []) fitVotes.set(f, (fitVotes.get(f) ?? 0) + 1);

      for (const p of PRODUCTS) {
        let points = 0;
        if (opt.activities?.some((a) => p.activities.includes(a))) points += 3;
        if (opt.categories?.includes(p.category)) points += 3;
        if (opt.worlds?.includes(p.world)) points += 2;
        if (opt.fits?.includes(p.fit)) points += 2;
        if (points > 0) productScores.set(p.slug, (productScores.get(p.slug) ?? 0) + points);
      }

      for (const prog of PROGRAMS) {
        let points = 0;
        if (opt.disciplines?.includes(prog.discipline)) points += 4;
        if (opt.levels?.includes(prog.level)) points += 3;
        if (points > 0) programScores.set(prog.slug, (programScores.get(prog.slug) ?? 0) + points);
      }
    }
  }

  const products = [...productScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([slug]) => PRODUCTS.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  const topProgramme =
    [...programScores.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? PROGRAMS[0].slug;

  const programme = PROGRAMS.find((p) => p.slug === topProgramme) ?? PROGRAMS[0];

  const fit =
    [...fitVotes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "regular";

  // Fall back to the featured set if the answers were too sparse to rank.
  const finalProducts = products.length >= 3 ? products : PRODUCTS.slice(0, 4);

  return {
    products: finalProducts,
    programme,
    fit,
    summary: SUMMARIES[fit],
  };
}

const SUMMARIES: Record<Fit, string> = {
  compression:
    "You want to feel held. Compression and sculpt fits, with graduated pressure where it earns its place — under load and after it.",
  sculpt:
    "Close to the body without gripping it. Sculpt fits follow the line rather than compressing it, which is what most people actually mean by supportive.",
  regular:
    "Athletic but unrestricted. Regular fits give you room at the shoulder and hip without the fabric hanging on you mid-set.",
  relaxed:
    "Nothing touching you while you work. Relaxed cuts with cleared shoulders and hems that stay where you put them.",
  oversized:
    "Drape is the point. Heavyweight fabrics cut deliberately loose, structured enough that oversized reads as intentional.",
};

/* ==================================================================
   RESULT
   ================================================================== */

function Result({ result, onRestart }: { result: ScoreResult; onRestart: () => void }) {
  return (
    <div className="pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <div className="shell">
        <div className="mb-14 max-w-[46rem] animate-rise">
          <p className="eyebrow mb-5 text-emerald-bright">Your performance fit</p>
          <h1 className="display-lg mb-6 text-bone">
            {result.fit.charAt(0).toUpperCase() + result.fit.slice(1)}.
          </h1>
          <p className="lede">{result.summary}</p>
        </div>

        {/* Programme */}
        <section className="relative grain mb-14 overflow-hidden border border-emerald/30 bg-carbon p-8 lg:p-10">
          <Specimen
            seed={`fit-${result.programme.slug}`}
            tone={result.programme.tone}
            className="absolute inset-0 size-full opacity-25"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/92 to-carbon/60" />

          <div className="relative z-[3] grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="eyebrow mb-4 text-emerald-bright">Start here</p>
              <h2 className="display-md mb-3 text-bone">{result.programme.name}</h2>
              <p className="mb-5 text-body font-medium text-emerald-bright">
                {result.programme.focus}
              </p>
              <p className="mb-6 max-w-[54ch] text-body-sm leading-relaxed text-smoke">
                {result.programme.summary}
              </p>
              <p className="numeric text-micro text-ash">
                {result.programme.weeks} weeks · {result.programme.daysPerWeek} days a week ·{" "}
                {result.programme.level} · {result.programme.coach}
              </p>
            </div>

            <Link href={`/train#${result.programme.slug}`} className="btn btn-emerald shrink-0">
              Start this programme
              <ArrowMark className="size-4" />
            </Link>
          </div>
        </section>

        {/* Products */}
        <section aria-labelledby="fit-products">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 id="fit-products" className="display-md text-bone">
              Your starting kit.
            </h2>
            <button type="button" onClick={onRestart} className="btn btn-ghost btn-sm">
              Retake the quiz
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {result.products.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-col gap-3 border-t border-bone/10 pt-10 sm:flex-row">
          <Link href="/shop" className="btn btn-primary">
            Shop the full collection
            <ArrowMark className="size-4" />
          </Link>
          <Link href="/bundles" className="btn btn-ghost">
            See the bundles instead
          </Link>
        </div>
      </div>
    </div>
  );
}
