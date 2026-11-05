"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { placeOrderAction, quoteAction, type Quote } from "@/lib/commerce/checkout-actions";
import { formatMoney } from "@/lib/commerce/money";
import { ShieldMark } from "@/components/primitives/Marks";
import type { ActionState } from "@/lib/security/validate";

interface Item {
  id: string;
  name: string;
  variant: string;
  quantity: number;
  totalCents: number;
  imageUrl: string | null;
  problem: string | null;
}

interface Props {
  currency: string;
  defaultCountry: string;
  countries: [string, string][];
  providers: { id: string; label: string }[];
  signedIn: boolean;
  prefill: Record<string, string>;
  items: Item[];
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
  autoComplete,
  required = true,
  className = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`co-${name}`} className="eyebrow mb-2 block">
        {label}
        {!required && <span className="ml-1 normal-case tracking-normal text-ash">(optional)</span>}
      </label>
      <input
        id={`co-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        required={required}
        className="field"
      />
    </div>
  );
}

export function CheckoutForm({ currency, defaultCountry, countries, providers, signedIn, prefill, items }: Props) {
  const [state, submit, submitting] = useActionState<ActionState, FormData>(placeOrderAction, { ok: true });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [country, setCountry] = useState(defaultCountry);
  const [rateId, setRateId] = useState<string | null>(null);
  const [code, setCode] = useState(prefill.discountCode ?? "");
  const [appliedCode, setAppliedCode] = useState(prefill.discountCode ?? "");
  const [quoting, startQuote] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(
    (next: { country?: string; rateId?: string | null; code?: string }) => {
      startQuote(async () => {
        const q = await quoteAction({
          country: next.country ?? country,
          shippingRateId: next.rateId === undefined ? rateId : next.rateId,
          discountCode: next.code ?? appliedCode,
          email: emailRef.current?.value ?? "",
        });
        setQuote(q);
        if (q) setRateId(q.shippingRateId);
      });
    },
    [country, rateId, appliedCode],
  );

  useEffect(() => {
    refresh({});
    // initial quote only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blocked = items.some((i) => i.problem);
  const money = (c: number) => formatMoney(c, currency);

  return (
    <form action={submit} className="grid gap-12 lg:grid-cols-[1fr_24rem] lg:gap-16">
      <div className="space-y-12">
        {/* Contact */}
        <fieldset className="space-y-4">
          <legend className="display-sm mb-5 text-bone">Contact</legend>
          <div>
            <label htmlFor="co-email" className="eyebrow mb-2 block">Email</label>
            <input
              ref={emailRef}
              id="co-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              readOnly={signedIn}
              defaultValue={prefill.email}
              className="field"
              onBlur={() => appliedCode && refresh({})}
            />
          </div>
          <Field name="phone" label="Phone" type="tel" autoComplete="tel" defaultValue={prefill.phone} required={false} />
          <label className="flex items-center gap-2.5 text-body-sm text-fog">
            <input type="checkbox" name="acceptsMarketing" className="size-4 accent-[var(--color-purple)]" />
            Email me about drops and restocks
          </label>
          {!signedIn && (
            <p className="text-caption text-smoke">
              Have an account?{" "}
              <Link href="/account?next=/checkout" className="link-rule text-bone">Sign in</Link> — or check out as a guest.
            </p>
          )}
        </fieldset>

        {/* Delivery */}
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="display-sm mb-5 text-bone">Delivery</legend>
          <div className="sm:col-span-2">
            <label htmlFor="co-country" className="eyebrow mb-2 block">Country</label>
            <select
              id="co-country"
              name="country"
              className="field"
              value={country}
              autoComplete="country"
              onChange={(e) => {
                setCountry(e.target.value);
                refresh({ country: e.target.value, rateId: null });
              }}
            >
              {countries.map(([c, n]) => (
                <option key={c} value={c}>{n}</option>
              ))}
            </select>
          </div>
          <Field name="firstName" label="First name" autoComplete="given-name" defaultValue={prefill.firstName} />
          <Field name="lastName" label="Last name" autoComplete="family-name" defaultValue={prefill.lastName} />
          <Field name="company" label="Company" autoComplete="organization" defaultValue={prefill.company} required={false} className="sm:col-span-2" />
          <Field name="line1" label="Address" autoComplete="address-line1" defaultValue={prefill.line1} className="sm:col-span-2" />
          <Field name="line2" label="Apartment, suite" autoComplete="address-line2" defaultValue={prefill.line2} required={false} className="sm:col-span-2" />
          <Field name="city" label="City" autoComplete="address-level2" defaultValue={prefill.city} />
          <Field name="region" label="State / region" autoComplete="address-level1" defaultValue={prefill.region} required={false} />
          <Field name="postalCode" label="Postal code" autoComplete="postal-code" defaultValue={prefill.postalCode} required={false} />
          {signedIn && (
            <label className="flex items-center gap-2.5 self-end pb-3 text-body-sm text-fog">
              <input type="checkbox" name="saveAddress" defaultChecked className="size-4 accent-[var(--color-purple)]" />
              Save to my account
            </label>
          )}
        </fieldset>

        {/* Shipping method */}
        <fieldset>
          <legend className="display-sm mb-5 text-bone">Delivery method</legend>
          {quote?.shippingError && <p className="text-body-sm" style={{ color: "var(--color-signal-out)" }}>{quote.shippingError}</p>}
          <div className="space-y-2">
            {quote?.shippingOptions.map((o) => (
              <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-4 border px-4 py-3.5 text-body-sm ${rateId === o.id ? "border-purple bg-purple/10" : "border-bone/12"}`}>
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingRateId"
                    value={o.id}
                    checked={rateId === o.id}
                    onChange={() => {
                      setRateId(o.id);
                      refresh({ rateId: o.id });
                    }}
                    className="accent-[var(--color-purple)]"
                  />
                  <span className="text-bone">{o.name}</span>
                  {o.days && <span className="text-smoke">{o.days}</span>}
                </span>
                <span className="numeric text-bone">{o.priceCents === 0 ? "Free" : money(o.priceCents)}</span>
              </label>
            ))}
            {!quote && <p className="text-body-sm text-smoke">{quoting ? "Calculating…" : "Enter your country to see delivery options."}</p>}
          </div>
        </fieldset>

        {/* Payment */}
        <fieldset>
          <legend className="display-sm mb-5 text-bone">Payment</legend>
          {providers.length === 0 ? (
            <p className="text-body-sm" style={{ color: "var(--color-signal-out)" }}>
              Online payment isn&apos;t available right now. Please try again later.
            </p>
          ) : (
            <div className="space-y-2">
              {providers.map((p, i) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-3 border border-bone/12 px-4 py-3.5 text-body-sm text-bone has-[:checked]:border-purple has-[:checked]:bg-purple/10">
                  <input type="radio" name="provider" value={p.id} defaultChecked={i === 0} required className="accent-[var(--color-purple)]" />
                  {p.label}
                </label>
              ))}
              <p className="flex items-center gap-2 pt-2 text-caption text-smoke">
                <ShieldMark className="size-3.5" /> You&apos;ll pay on the provider&apos;s secure page. Card details never touch our servers.
              </p>
            </div>
          )}
        </fieldset>

        <div>
          <label htmlFor="co-note" className="eyebrow mb-2 block">Order note <span className="ml-1 normal-case tracking-normal text-ash">(optional)</span></label>
          <textarea id="co-note" name="note" rows={3} maxLength={1000} className="field" />
        </div>
      </div>

      {/* Summary */}
      <aside className="h-fit border border-bone/10 bg-carbon p-6 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
        <h2 className="eyebrow mb-5">Order summary</h2>
        <ul className="mb-6 space-y-4">
          {items.map((i) => (
            <li key={i.id} className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden bg-graphite">
                {i.imageUrl && <Image src={i.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                <span className="absolute right-0 top-0 bg-purple px-1.5 text-micro text-bone">{i.quantity}</span>
              </div>
              <div className="min-w-0 flex-1 text-body-sm">
                <p className="truncate text-bone">{i.name}</p>
                {i.variant && <p className="text-caption text-smoke">{i.variant}</p>}
                {i.problem && <p className="text-caption" style={{ color: "var(--color-signal-out)" }}>{i.problem}</p>}
              </div>
              <p className="numeric text-body-sm text-bone">{money(i.totalCents)}</p>
            </li>
          ))}
        </ul>

        <div className="mb-5 flex gap-2">
          <label htmlFor="co-code" className="sr-only">Discount code</label>
          <input
            id="co-code"
            name="discountCode"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Discount code"
            className="field flex-1 uppercase"
            maxLength={64}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm shrink-0"
            onClick={() => {
              setAppliedCode(code);
              refresh({ code });
            }}
          >
            Apply
          </button>
        </div>
        {quote?.discountError && appliedCode && (
          <p className="-mt-3 mb-4 text-caption" style={{ color: "var(--color-signal-out)" }}>{quote.discountError}</p>
        )}

        <dl className="space-y-2 border-t border-bone/10 pt-4 text-body-sm">
          <div className="flex justify-between"><dt className="text-smoke">Subtotal</dt><dd className="numeric text-bone">{quote ? money(quote.subtotalCents) : "—"}</dd></div>
          {quote && quote.discountCents > 0 && (
            <div className="flex justify-between"><dt className="text-smoke">Discount{quote.discountTitle ? ` · ${quote.discountTitle}` : ""}</dt><dd className="numeric text-purple-bright">−{money(quote.discountCents)}</dd></div>
          )}
          <div className="flex justify-between"><dt className="text-smoke">Shipping</dt><dd className="numeric text-bone">{quote?.shippingRateId ? (quote.shippingCents ? money(quote.shippingCents) : "Free") : "—"}</dd></div>
          {quote && quote.taxCents > 0 && (
            <div className="flex justify-between"><dt className="text-smoke">Tax</dt><dd className="numeric text-bone">{money(quote.taxCents)}</dd></div>
          )}
          <div className="flex justify-between border-t border-bone/10 pt-3 text-body"><dt className="text-bone">Total</dt><dd className="numeric font-medium text-bone">{quote ? money(quote.totalCents) : "—"}</dd></div>
        </dl>

        {state.error && (
          <p role="alert" className="mt-5 text-body-sm" style={{ color: "var(--color-signal-out)" }}>{state.error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || blocked || providers.length === 0 || !quote?.shippingRateId}
          className="btn btn-primary btn-block mt-6 disabled:opacity-50"
        >
          {submitting ? "Securing your order…" : quote ? `Pay ${money(quote.totalCents)}` : "Pay"}
        </button>
        <p className="mt-3 text-center text-micro text-ash">
          Stock is held for you while you pay. Charged in {currency}.
        </p>
      </aside>
    </form>
  );
}
