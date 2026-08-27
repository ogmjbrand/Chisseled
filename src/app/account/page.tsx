import Link from "next/link";
import { BrandVideo } from "@/components/primitives/BrandVideo";
import { PROGRAMS } from "@/lib/catalog";
import { pageMetadata } from "@/lib/seo";
import { ArrowMark, CheckMark } from "@/components/primitives/Marks";

export const metadata = {
  ...pageMetadata({
    title: "Account",
    description: "Sign in to CHISSELED — orders, training, subscriptions and rewards.",
    path: "/account",
  }),
  robots: { index: false, follow: false },
};

const BENEFITS = [
  "Order history and one-tap reorder",
  "Your training dashboard and logged sessions",
  "Subscription control — skip, pause, cancel",
  "Back-in-stock alerts in your size",
  "Member-only drops and early access",
  "Rewards on every order and referral",
];

const TIERS = [
  { name: "Foundation", spend: "From your first order", perks: "Free standard shipping · Birthday reward" },
  { name: "Committed", spend: "$500 lifetime", perks: "Early access to drops · Double points" },
  { name: "Chisseled", spend: "$1,500 lifetime", perks: "Member-only products · Coaching consultation · Priority support" },
];

export default function AccountPage() {
  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-20">
        <div>
          <p className="eyebrow mb-5">Account</p>
          <h1 className="display-md mb-6 text-bone">Everything in one place.</h1>
          <p className="lede mb-10 max-w-[46ch]">
            One account covers the store, the training platform and your subscriptions. You do
            not need it to buy — guest checkout is always available.
          </p>

          <ul className="mb-14 grid gap-3 sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-baseline gap-2.5 text-body-sm text-fog">
                <CheckMark className="size-3.5 shrink-0 translate-y-0.5 text-purple-bright" />
                {b}
              </li>
            ))}
          </ul>

          {/* --- Loyalty --- */}
          <section aria-labelledby="loyalty-heading" className="mb-14">
            <div className="mb-7 flex flex-wrap items-start gap-7">
              <div className="w-full max-w-[13rem] shrink-0 overflow-hidden border border-purple/25">
                <BrandVideo role="loyalty" fit="cover" grade="signal" className="aspect-[9/16] w-full" />
              </div>
              <div className="min-w-[16rem] flex-1">
            <h2 id="loyalty-heading" className="display-sm mb-3 text-bone">
              The Chisseled Programme
            </h2>
            <p className="mb-7 max-w-[52ch] text-body-sm leading-relaxed text-smoke">
              Points on every order and every referral. Tiers are lifetime, not annual — we are
              not going to reset your standing because a calendar turned over.
            </p>
              </div>
            </div>

            <ol className="grid gap-px border border-bone/10 bg-bone/10 sm:grid-cols-3">
              {TIERS.map((t, i) => (
                <li key={t.name} className="bg-carbon p-6">
                  <p className="numeric mb-4 text-caption text-steel">0{i + 1}</p>
                  <h3 className="mb-2 font-display text-h6 font-bold uppercase tracking-tight text-bone">
                    {t.name}
                  </h3>
                  <p className="mb-3 font-mono text-micro uppercase tracking-[0.12em] text-purple-bright">
                    {t.spend}
                  </p>
                  <p className="text-body-sm leading-relaxed text-smoke">{t.perks}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* --- Referral --- */}
          <section aria-labelledby="referral-heading" className="mb-14">
            <h2 id="referral-heading" className="display-sm mb-3 text-bone">
              Refer a training partner
            </h2>
            <p className="mb-6 max-w-[52ch] text-body-sm leading-relaxed text-smoke">
              They get $20 off their first order. You get $20 when it ships. No cap, no
              expiry, no requirement that they spend a qualifying amount first.
            </p>
            <Link href="#signin" className="btn btn-ghost btn-sm">
              Get your referral link
            </Link>
          </section>

          {/* --- Alerts --- */}
          <section id="alerts" aria-labelledby="alerts-heading">
            <h2 id="alerts-heading" className="display-sm mb-3 text-bone">
              Back-in-stock alerts
            </h2>
            <p className="mb-6 max-w-[52ch] text-body-sm leading-relaxed text-smoke">
              Tell us the product and size. You will hear the moment it lands — before the
              restock is announced anywhere else.
            </p>
            <form className="flex flex-col gap-2.5 sm:flex-row sm:max-w-[34rem]">
              <label htmlFor="alert-email" className="sr-only">
                Email for stock alerts
              </label>
              <input
                id="alert-email"
                type="email"
                required
                placeholder="you@email.com"
                autoComplete="email"
                className="field flex-1"
              />
              <button type="submit" className="btn btn-primary shrink-0">
                Notify me
              </button>
            </form>
          </section>
        </div>

        {/* --- Sign in --- */}
        <aside id="signin" className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:h-fit">
          <div className="border border-bone/10 bg-carbon p-7">
            <h2 className="display-sm mb-6 text-bone">Sign in</h2>

            <form className="space-y-4">
              <div>
                <label htmlFor="account-email" className="eyebrow mb-2 block">
                  Email
                </label>
                <input
                  id="account-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="account-password" className="eyebrow mb-2 block">
                  Password
                </label>
                <input
                  id="account-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="field"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
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

          <div className="mt-4 border border-bone/10 bg-ink p-6">
            <p className="eyebrow mb-4">Continue training</p>
            <ul className="space-y-2.5">
              {PROGRAMS.slice(0, 2).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/train#${p.slug}`}
                    className="group flex items-center justify-between gap-3 border border-bone/10 p-3.5 transition-colors duration-400 hover:border-bone/30"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-caption text-bone">{p.name}</span>
                      <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-smoke">
                        {p.discipline} · {p.weeks} weeks
                      </span>
                    </span>
                    <ArrowMark className="size-4 shrink-0 text-ash transition-transform duration-400 group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
