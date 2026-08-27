"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORWAYS } from "@/lib/art";
import { getBundle, getProduct } from "@/lib/catalog";
import { FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/format";
import { useStore } from "@/lib/store";
import { Flat } from "@/components/primitives/Visual";
import {
  ArrowMark,
  CheckMark,
  ReturnMark,
  ShieldMark,
  TruckMark,
} from "@/components/primitives/Marks";

/**
 * Frictionless by construction: one page, three collapsible steps, no
 * upsells between the customer and the button. Guest checkout is the
 * default because forcing an account is the single most reliable way to
 * lose a first order.
 *
 * PRODUCTION NOTE: this is the interface only. Wire the payment step to
 * the PSP (Paystack / Flutterwave for local rails, Stripe for
 * international) and never handle raw card data in this component.
 */

type PaymentMethod = "card" | "transfer" | "wallet";

const PAYMENTS: { id: PaymentMethod; label: string; note: string }[] = [
  { id: "card", label: "Card", note: "Visa, Mastercard, Amex, Discover" },
  { id: "transfer", label: "Pay later", note: "4 interest-free installments" },
  { id: "wallet", label: "Apple Pay / Google Pay", note: "Where available on your device" },
];

const SHIPPING = [
  { id: "standard", label: "Standard", note: "3–5 business days", price: 700 },
  { id: "express", label: "Express", note: "1–2 business days", price: 1800 },
  { id: "international", label: "International", note: "6–12 business days", price: 3500 },
];

export function CheckoutFlow() {
  const { lines, subtotal, currency, remove } = useStore();
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [shipping, setShipping] = useState(SHIPPING[0].id);
  const [placed, setPlaced] = useState(false);

  const shipRate = SHIPPING.find((s) => s.id === shipping)!;
  const shipCost = subtotal >= FREE_SHIPPING_THRESHOLD && shipping === "standard" ? 0 : shipRate.price;
  const total = subtotal + shipCost;

  if (placed) return <Confirmation />;

  if (lines.length === 0) {
    return (
      <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow mb-5">Checkout</p>
        <h1 className="display-md mb-4 text-bone">Your bag is empty.</h1>
        <p className="mb-8 max-w-[34ch] text-body-sm text-smoke">
          Add something to it and this page will have work to do.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Shop the collection
          <ArrowMark className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <div className="mb-12">
        <p className="eyebrow mb-5">Secure checkout</p>
        <h1 className="display-md text-bone">Complete your order.</h1>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
        {/* ============ STEPS ============ */}
        <div>
          <ol className="space-y-3">
            <Step n={1} title="Contact" current={step} onOpen={setStep}>
              <div className="space-y-4">
                <Field id="email" label="Email" type="email" autoComplete="email" required />
                <Field id="phone" label="Phone" type="tel" autoComplete="tel" required />
                <label className="flex items-start gap-2.5 text-body-sm text-smoke">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-0.5 size-4 shrink-0 appearance-none border border-bone/25 checked:border-purple checked:bg-purple"
                  />
                  Email me order updates and early access to drops.
                </label>
                <p className="text-micro text-ash">
                  Checking out as a guest.{" "}
                  <Link href="/account" className="link-rule text-smoke">
                    Sign in
                  </Link>{" "}
                  to use a saved address instead.
                </p>
              </div>

              <button type="button" onClick={() => setStep(2)} className="btn btn-primary mt-6">
                Continue to delivery
              </button>
            </Step>

            <Step n={2} title="Delivery" current={step} onOpen={setStep}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="first" label="First name" autoComplete="given-name" required />
                <Field id="last" label="Last name" autoComplete="family-name" required />
                <div className="sm:col-span-2">
                  <Field id="address" label="Address" autoComplete="street-address" required />
                </div>
                <Field id="city" label="City" autoComplete="address-level2" required />
                <Field id="state" label="State / Region" autoComplete="address-level1" required />
                <Field id="postal" label="Postal code" autoComplete="postal-code" />
                <div>
                  <label htmlFor="country" className="eyebrow mb-2 block">
                    Country
                  </label>
                  <select id="country" autoComplete="country-name" className="field" defaultValue="US">
                    {["NG", "GH", "KE", "ZA", "GB", "US", "CA", "AE"].map((c) => (
                      <option key={c} value={c} className="bg-ink">
                        {COUNTRY_NAMES[c]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <fieldset className="mt-8">
                <legend className="eyebrow mb-3">Delivery speed</legend>
                <div className="space-y-2">
                  {SHIPPING.map((s) => {
                    const free = s.id === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD;
                    return (
                      <label
                        key={s.id}
                        className={[
                          "flex cursor-pointer items-center gap-3.5 border p-4 transition-colors duration-400",
                          shipping === s.id ? "border-purple bg-purple/8" : "border-bone/15 hover:border-bone/35",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="shipping"
                          value={s.id}
                          checked={shipping === s.id}
                          onChange={() => setShipping(s.id)}
                          className="size-4 shrink-0 accent-[var(--color-purple)]"
                        />
                        <span className="flex-1">
                          <span className="block text-body-sm text-bone">{s.label}</span>
                          <span className="block text-micro text-smoke">{s.note}</span>
                        </span>
                        <span className="numeric text-body-sm text-bone">
                          {free ? (
                            <span className="text-purple-bright">Free</span>
                          ) : (
                            formatPrice(s.price, currency)
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <button type="button" onClick={() => setStep(3)} className="btn btn-primary mt-6">
                Continue to payment
              </button>
            </Step>

            <Step n={3} title="Payment" current={step} onOpen={setStep}>
              <fieldset>
                <legend className="eyebrow mb-3">Payment method</legend>
                <div className="space-y-2">
                  {PAYMENTS.map((p) => (
                    <label
                      key={p.id}
                      className={[
                        "flex cursor-pointer items-center gap-3.5 border p-4 transition-colors duration-400",
                        payment === p.id ? "border-purple bg-purple/8" : "border-bone/15 hover:border-bone/35",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={p.id}
                        checked={payment === p.id}
                        onChange={() => setPayment(p.id)}
                        className="size-4 shrink-0 accent-[var(--color-purple)]"
                      />
                      <span className="flex-1">
                        <span className="block text-body-sm text-bone">{p.label}</span>
                        <span className="block text-micro text-smoke">{p.note}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {payment === "card" && (
                <p className="mt-6 flex items-start gap-2.5 border border-bone/10 bg-carbon p-4 text-body-sm text-smoke">
                  <ShieldMark className="mt-0.5 size-4 shrink-0 text-purple-bright" />
                  Card details are collected by our payment provider on their own secure form.
                  CHISSELED never sees or stores your card number.
                </p>
              )}

              {payment === "transfer" && (
                <p className="mt-6 border border-bone/10 bg-carbon p-4 text-body-sm text-smoke">
                  You&apos;ll receive a one-time account number after placing the order. Your
                  order ships as soon as the transfer clears — usually within minutes.
                </p>
              )}

              <button
                type="button"
                onClick={() => setPlaced(true)}
                className="btn btn-purple btn-block mt-8"
              >
                Place order · {formatPrice(total, currency)}
              </button>

              <p className="mt-4 text-micro leading-relaxed text-ash">
                By placing this order you agree to our terms of sale. This is a demonstration
                storefront — no payment will be taken and no order will be dispatched.
              </p>
            </Step>
          </ol>
        </div>

        {/* ============ SUMMARY ============ */}
        <aside className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)] lg:h-fit">
          <div className="border border-bone/10 bg-carbon">
            <h2 className="border-b border-bone/10 px-5 py-4 font-mono text-label uppercase tracking-[0.18em] text-bone">
              Order summary
            </h2>

            <ul className="divide-y divide-bone/8">
              {lines.map((line) => {
                const bundle = line.bundleSlug ? getBundle(line.bundleSlug) : undefined;
                const product = getProduct(line.slug);
                const name = bundle?.name ?? product?.name ?? "Item";
                const unit = bundle?.price ?? product?.price ?? 0;

                return (
                  <li key={line.id} className="flex gap-3.5 p-4">
                    <div className="relative size-16 shrink-0 overflow-hidden bg-graphite">
                      {product && (
                        <Flat
                          flat={product.flat}
                          colorway={line.colorway}
                          seed={`co-${line.id}`}
                          className="size-full"
                        />
                      )}
                      <span className="numeric absolute right-0 top-0 flex size-5 items-center justify-center bg-bone text-[0.625rem] text-ink">
                        {line.qty}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-caption text-bone">{name}</p>
                      <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.12em] text-smoke">
                        {bundle
                          ? `${bundle.items.length} pieces`
                          : `${COLORWAYS[line.colorway]?.name ?? ""} · ${line.size}`}
                      </p>
                      <button
                        type="button"
                        onClick={() => remove(line.id)}
                        className="mt-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ash transition-colors hover:text-signal-low"
                      >
                        Remove
                      </button>
                    </div>

                    <span className="numeric shrink-0 text-caption text-bone">
                      {formatPrice(unit * line.qty, currency)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="space-y-2.5 border-t border-bone/10 p-5">
              <Row label="Subtotal" value={formatPrice(subtotal, currency)} />
              <Row
                label="Shipping"
                value={shipCost === 0 ? "Free" : formatPrice(shipCost, currency)}
                accent={shipCost === 0}
              />
              <Row label="Taxes" value="Calculated at payment" muted />

              <div className="flex items-baseline justify-between border-t border-bone/10 pt-4">
                <span className="font-mono text-label uppercase tracking-[0.18em] text-bone">
                  Total
                </span>
                <span className="numeric text-h5 text-bone">{formatPrice(total, currency)}</span>
              </div>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {[
              { icon: ShieldMark, text: "Secure checkout — encrypted end to end" },
              { icon: TruckMark, text: "Fast delivery — 38 countries served" },
              { icon: ReturnMark, text: "Easy returns — 30 days, tags on" },
            ].map((a) => (
              <li key={a.text} className="flex items-center gap-2.5 text-caption text-smoke">
                <a.icon className="size-4 shrink-0 text-purple-bright" />
                {a.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

/* ================================================================== */

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  CA: "Canada",
  GB: "United Kingdom",
  IE: "Ireland",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  MX: "Mexico",
};

function Step({
  n,
  title,
  current,
  onOpen,
  children,
}: {
  n: number;
  title: string;
  current: number;
  onOpen: (n: number) => void;
  children: React.ReactNode;
}) {
  const open = current === n;
  const done = current > n;

  return (
    <li className="border border-bone/10 bg-carbon">
      <h2>
        <button
          type="button"
          onClick={() => onOpen(n)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 p-5 text-left"
        >
          <span
            className={[
              "flex size-7 shrink-0 items-center justify-center border font-mono text-micro transition-colors duration-400",
              done
                ? "border-purple bg-purple text-bone"
                : open
                  ? "border-bone text-bone"
                  : "border-bone/25 text-ash",
            ].join(" ")}
          >
            {done ? <CheckMark className="size-3.5" /> : n}
          </span>
          <span
            className={[
              "font-mono text-label uppercase tracking-[0.18em] transition-colors duration-400",
              open || done ? "text-bone" : "text-ash",
            ].join(" ")}
          >
            {title}
          </span>
        </button>
      </h2>

      <div
        className={[
          "grid transition-[grid-template-rows,opacity] duration-[520ms] ease-[var(--ease-out-expo)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-6">{children}</div>
        </div>
      </div>
    </li>
  );
}

function Field({
  id,
  label,
  type = "text",
  autoComplete,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-2 block">
        {label}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <input id={id} type={type} autoComplete={autoComplete} required={required} className="field" />
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  muted,
}: {
  label: string;
  value: string;
  accent?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-body-sm text-smoke">{label}</span>
      <span
        className={[
          "numeric text-body-sm",
          accent ? "text-purple-bright" : muted ? "text-ash" : "text-bone",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function Confirmation() {
  return (
    <div className="shell flex min-h-[78svh] flex-col items-center justify-center py-20 text-center">
      <span className="mb-8 flex size-16 items-center justify-center border border-purple text-purple-bright">
        <CheckMark className="size-8" />
      </span>
      <p className="eyebrow mb-5 text-purple-bright">Order placed</p>
      <h1 className="display-lg mb-5 max-w-[16ch] text-bone">Welcome to the work.</h1>
      <p className="mb-9 max-w-[46ch] text-body leading-relaxed text-smoke">
        A confirmation is on its way to your inbox with tracking details. This is a
        demonstration storefront — no payment was taken.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/train" className="btn btn-primary">
          Start your first programme
          <ArrowMark className="size-4" />
        </Link>
        <Link href="/shop" className="btn btn-ghost">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
