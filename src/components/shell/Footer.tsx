"use client";

import Link from "next/link";
import { useState } from "react";
import { FOOTER_COLUMNS } from "@/lib/nav";
import { CURRENCIES, type CurrencyCode } from "@/lib/format";
import { useStore } from "@/lib/store";
import { ArrowMark, CheckMark, Monogram } from "@/components/primitives/Marks";

export function Footer() {
  return (
    <footer className="relative grain border-t border-bone/10 bg-ink">
      {/* --- The closing statement --- */}
      <div className="shell relative z-[3] border-b border-bone/10 py-[clamp(4rem,10vw,9rem)]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <h2 className="display-xl text-bone" data-reveal-line>
              <span>Become</span>
            </h2>
            <h2 className="display-xl text-emerald" data-reveal-line style={{ "--reveal-delay": "90ms" } as React.CSSProperties}>
              <span>Chisseled.</span>
            </h2>
          </div>

          <NewsletterForm />
        </div>
      </div>

      {/* --- Directory --- */}
      <div className="shell relative z-[3] grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-6">
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="eyebrow mb-5">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-body-sm text-smoke transition-colors duration-300 hover:text-bone"
                  >
                    <span className="link-rule">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* --- Legal bar --- */}
      <div className="shell relative z-[3] flex flex-col gap-6 border-t border-bone/10 py-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Monogram className="size-5 text-bone" />
          <p className="font-mono text-micro uppercase tracking-[0.18em] text-ash">
            © {new Date().getFullYear()} Chisseled ·{" "}
            <span className="text-smoke">OGMJ Brands — From Idea to Empire</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
          <PaymentMarks />
          <RegionSelect />
          <Social />
        </div>
      </div>

      <div className="shell relative z-[3] flex flex-wrap gap-x-6 gap-y-2 pb-10">
        {["Privacy", "Terms", "Cookies", "Modern Slavery Statement", "Accessibility"].map((t) => (
          <Link
            key={t}
            href="/about#legal"
            className="text-micro text-ash transition-colors hover:text-smoke"
          >
            {t}
          </Link>
        ))}
      </div>
    </footer>
  );
}

/* ================================================================== */

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "done">("idle");

  return (
    <div>
      <h3 className="display-sm mb-3 text-bone">Join the movement.</h3>
      <p className="mb-6 max-w-[32rem] text-body-sm leading-relaxed text-smoke">
        Early access to drops, new programmes, and the training writing we do not publish
        anywhere else. No more than twice a month.
      </p>

      {state === "done" ? (
        <p
          className="inline-flex items-center gap-2 border border-emerald/30 bg-emerald/10 px-5 py-4 text-body-sm text-emerald-bright"
          role="status"
        >
          <CheckMark className="size-4 shrink-0" />
          You&apos;re in. Check your inbox to confirm.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // Wire to the email platform in production.
            setState("done");
          }}
          className="flex flex-col gap-2.5 sm:flex-row"
        >
          <label htmlFor="footer-email" className="sr-only">
            Email address
          </label>
          <input
            id="footer-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className="field flex-1"
          />
          <button type="submit" className="btn btn-primary shrink-0">
            Join
            <ArrowMark className="size-4" />
          </button>
        </form>
      )}

      <p className="mt-4 text-micro leading-relaxed text-ash">
        By subscribing you agree to our{" "}
        <Link href="/about#legal" className="link-rule text-smoke">
          privacy policy
        </Link>
        . Unsubscribe in one click, any time.
      </p>
    </div>
  );
}

function RegionSelect() {
  const { currency, setCurrency } = useStore();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="currency" className="sr-only">
        Currency
      </label>
      <select
        id="currency"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="border border-bone/15 bg-transparent px-3 py-2 font-mono text-micro uppercase tracking-[0.14em] text-fog transition-colors hover:border-bone/35 focus:border-emerald focus:outline-none"
      >
        {Object.values(CURRENCIES).map((c) => (
          <option key={c.code} value={c.code} className="bg-ink">
            {c.code} {c.symbol}
          </option>
        ))}
      </select>
    </div>
  );
}

function PaymentMarks() {
  // Drawn rather than imported, so the footer carries no third-party assets.
  const marks = ["Visa", "Mastercard", "Verve", "Transfer", "Apple Pay", "Google Pay"];
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Accepted payment methods">
      {marks.map((m) => (
        <li
          key={m}
          className="border border-bone/12 px-2.5 py-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ash"
        >
          {m}
        </li>
      ))}
    </ul>
  );
}

function Social() {
  const links = [
    { label: "Instagram", href: "https://instagram.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "X", href: "https://x.com" },
  ];

  return (
    <ul className="flex items-center gap-4">
      {links.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-micro uppercase tracking-[0.14em] text-ash transition-colors hover:text-bone"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
