import Link from "next/link";
import { db } from "@/lib/db";
import type { Customer } from "@/lib/auth/customer";
import { customerSignOutAction } from "@/lib/auth/customer-actions";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { statusLabel } from "@/components/orders/OrderSummary";
import { COUNTRIES, COUNTRY_NAME } from "@/lib/commerce/countries";
import { StoreField, StoreForm } from "@/components/account/StoreForm";
import { changePasswordAction, defaultAddressAction, deleteAddressAction, saveAddressAction, updateProfileAction } from "@/lib/auth/account-actions";

export async function AccountDashboard({ customer }: { customer: Customer }) {
  const settings = await getStoreSettings();
  const [orders, addresses, [stats], [profile]] = await Promise.all([
    db()<{ id: string; number: number; created_at: Date; total_cents: number; currency: string; payment_status: string; fulfillment_status: string; status: string; items: number }[]>`
      select o.id, o.number, o.created_at, o.total_cents, o.currency, o.payment_status, o.fulfillment_status, o.status,
             (select coalesce(sum(quantity),0)::int from order_items where order_id = o.id) as items
      from orders o where o.customer_id = ${customer.id} and o.payment_status <> 'voided'
      order by o.created_at desc limit 50`,
    db()<{ id: string; first_name: string; last_name: string; line1: string; line2: string; city: string; region: string; postal_code: string; country: string; is_default: boolean }[]>`
      select id, first_name, last_name, line1, line2, city, region, postal_code, country, is_default
      from customer_addresses where customer_id = ${customer.id} order by is_default desc, created_at desc`,
    db()<{ spent: number; count: number }[]>`
      select coalesce(sum(total_cents - refunded_cents),0)::int as spent, count(*)::int as count
      from orders where customer_id = ${customer.id} and payment_status in ('paid','partially_refunded','refunded')`,
    db()<{ accepts_marketing: boolean; has_password: boolean }[]>`
      select accepts_marketing, password_hash is not null as has_password from customers where id = ${customer.id}`,
  ]);

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+3rem)]">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow mb-4">Account</p>
          <h1 className="display-md text-bone">
            {customer.firstName ? `Welcome back, ${customer.firstName}.` : "Welcome back."}
          </h1>
          <p className="mt-3 text-body-sm text-smoke">{customer.email}</p>
        </div>
        <form action={customerSignOutAction}>
          <button className="btn btn-ghost btn-sm">Sign out</button>
        </form>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="display-sm mb-6 text-bone">Orders</h2>
          {orders.length === 0 ? (
            <div className="border border-bone/10 bg-carbon p-8 text-body-sm text-smoke">
              No orders yet.{" "}
              <Link href="/shop" className="link-rule text-bone">Start with the collection</Link>.
            </div>
          ) : (
            <ul className="divide-y divide-bone/10 border-y border-bone/10">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/account/orders/${o.number}`} className="flex flex-wrap items-center justify-between gap-4 py-4 transition-colors hover:bg-bone/[0.03]">
                    <span>
                      <span className="block text-body-sm text-bone">{orderName(o.number, settings.order_prefix)}</span>
                      <span className="block text-caption text-smoke">
                        {o.created_at.toLocaleDateString("en", { dateStyle: "medium" })} · {o.items} item{o.items === 1 ? "" : "s"}
                      </span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="badge badge-steel">{o.status === "cancelled" ? "Cancelled" : statusLabel(o.payment_status === "paid" ? o.fulfillment_status : o.payment_status)}</span>
                      <span className="numeric text-body-sm text-bone">{formatMoney(o.total_cents, o.currency)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="border border-bone/10 bg-carbon p-6">
            <p className="eyebrow mb-3">Lifetime</p>
            <p className="numeric text-h4 text-bone">{formatMoney(stats?.spent ?? 0, settings.currency)}</p>
            <p className="text-caption text-smoke">{stats?.count ?? 0} paid order{stats?.count === 1 ? "" : "s"}</p>
          </div>
          <div className="border border-bone/10 bg-carbon p-6">
            <p className="eyebrow mb-4">Saved addresses</p>
            {addresses.length === 0 ? (
              <p className="text-body-sm text-smoke">No saved addresses yet.</p>
            ) : (
              <ul className="space-y-5 text-body-sm text-fog">
                {addresses.map((a) => (
                  <li key={a.id}>
                    {a.is_default && <span className="badge badge-purple mb-2">Default</span>}
                    <p>{a.first_name} {a.last_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />{a.city}{a.region ? `, ${a.region}` : ""} {a.postal_code}<br />{COUNTRY_NAME.get(a.country) ?? a.country}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {!a.is_default && (
                        <StoreForm action={defaultAddressAction} submit="Make default" variant="ghost" className="contents">
                          <input type="hidden" name="id" value={a.id} />
                        </StoreForm>
                      )}
                      <StoreForm action={deleteAddressAction} submit="Remove" variant="ghost" className="contents" confirm="Remove this address?">
                        <input type="hidden" name="id" value={a.id} />
                      </StoreForm>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-5 border-t border-bone/10 pt-4">
              <summary className="cursor-pointer text-caption text-bone">Add an address</summary>
              <StoreForm action={saveAddressAction} submit="Save address" variant="ghost" resetOnSuccess className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <StoreField name="first_name" label="First name" defaultValue={customer.firstName} autoComplete="given-name" />
                  <StoreField name="last_name" label="Last name" defaultValue={customer.lastName} autoComplete="family-name" />
                </div>
                <StoreField name="line1" label="Address" autoComplete="address-line1" />
                <StoreField name="line2" label="Apartment, suite" required={false} autoComplete="address-line2" />
                <div className="grid grid-cols-2 gap-3">
                  <StoreField name="city" label="City" autoComplete="address-level2" />
                  <StoreField name="region" label="State / region" required={false} autoComplete="address-level1" />
                </div>
                <StoreField name="postal_code" label="Postal code" required={false} autoComplete="postal-code" />
                <div>
                  <label htmlFor="f-country" className="eyebrow mb-2 block">Country</label>
                  <select id="f-country" name="country" defaultValue={settings.country} className="field">
                    {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                </div>
                <StoreField name="phone" label="Phone" type="tel" required={false} autoComplete="tel" />
                <label className="flex items-center gap-2 text-caption text-fog"><input type="checkbox" name="is_default" className="accent-[var(--color-purple)]" />Make this my default</label>
              </StoreForm>
            </details>
          </div>

          <div className="border border-bone/10 bg-carbon p-6">
            <p className="eyebrow mb-4">Profile</p>
            <StoreForm action={updateProfileAction} submit="Save profile" variant="ghost" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <StoreField name="first_name" label="First name" defaultValue={customer.firstName} autoComplete="given-name" />
                <StoreField name="last_name" label="Last name" defaultValue={customer.lastName} required={false} autoComplete="family-name" />
              </div>
              <StoreField name="phone" label="Phone" type="tel" defaultValue={customer.phone} required={false} autoComplete="tel" />
              <label className="flex items-center gap-2 text-caption text-fog">
                <input type="checkbox" name="accepts_marketing" defaultChecked={profile?.accepts_marketing} className="accent-[var(--color-purple)]" />
                Email me about drops and restocks
              </label>
            </StoreForm>
          </div>

          {profile?.has_password && (
            <div className="border border-bone/10 bg-carbon p-6">
              <p className="eyebrow mb-4">Password</p>
              <StoreForm action={changePasswordAction} submit="Change password" variant="ghost" resetOnSuccess className="space-y-3">
                <StoreField name="current_password" label="Current password" type="password" autoComplete="current-password" />
                <StoreField name="new_password" label="New password" type="password" autoComplete="new-password" minLength={10} />
              </StoreForm>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
