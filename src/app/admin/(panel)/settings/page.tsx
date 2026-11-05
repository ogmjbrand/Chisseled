import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Field, Forbidden, PageHeader } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { changeOwnPasswordAction, savePaymentSettingsAction, saveStoreSettingsAction } from "@/lib/admin/staff-actions";
import { getPaymentSettings, getStoreSettings } from "@/lib/commerce/settings";
import { COUNTRIES } from "@/lib/commerce/countries";
import { PROVIDERS } from "@/lib/payments";

export const metadata = { title: "Settings" };

const CURRENCIES = ["USD", "NGN", "GHS", "KES", "ZAR", "GBP", "EUR", "CAD"];

function Integration({ name, ok, detail }: { name: string; ok: boolean; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-[0.8125rem]">
      <span><span className="text-bone">{name}</span><span className="block text-[0.75rem] text-smoke">{detail}</span></span>
      <Badge value={ok ? "active" : "disabled"} label={ok ? "configured" : "not configured"} />
    </li>
  );
}

export default async function Settings() {
  const staff = await guard("settings:read");
  if (!staff) return <Forbidden />;
  const [s, pay] = await Promise.all([getStoreSettings(), getPaymentSettings()]);
  const writable = can(staff, "settings:write");
  const base = process.env.APP_URL ?? "https://<your-domain>";
  return (
    <>
      <PageHeader title="Settings" description="Store configuration. Secret keys live only in server environment variables and are never shown or stored here." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Store">
          <fieldset disabled={!writable}>
            <ActionForm action={saveStoreSettingsAction} className="grid gap-3 sm:grid-cols-2">
              <Field label="Store name"><input name="name" required defaultValue={s.name} className="adm-input" /></Field>
              <Field label="Sender / contact email"><input name="email" type="email" required defaultValue={s.email} className="adm-input" /></Field>
              <Field label="Store currency" hint="Prices are stored in this currency. Changing it doesn't convert them.">
                <select name="currency" defaultValue={s.currency} className="adm-input">{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </Field>
              <Field label="Store country"><select name="country" defaultValue={s.country} className="adm-input">{COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></Field>
              <Field label="Tax rate (%)" hint="Applied to the discounted subtotal."><input name="tax_rate" inputMode="decimal" defaultValue={(s.tax_rate_bps / 100).toString()} className="adm-input" /></Field>
              <label className="flex items-center gap-2 self-end pb-2 text-[0.8125rem]"><input type="checkbox" name="tax_inclusive" defaultChecked={s.tax_inclusive} className="accent-[var(--color-purple)]" />Prices include tax</label>
              <Field label="Stock reservation (minutes)" hint="How long checkout holds stock while the shopper pays."><input name="reservation_minutes" type="number" min={10} max={1440} defaultValue={s.reservation_minutes} className="adm-input" /></Field>
              <Field label="Default low-stock threshold"><input name="low_stock_default" type="number" min={0} defaultValue={s.low_stock_default} className="adm-input" /></Field>
              <Field label="Order number prefix" hint={`Orders show as #${s.order_prefix}1001`}><input name="order_prefix" maxLength={6} defaultValue={s.order_prefix} className="adm-input font-mono uppercase" /></Field>
              <label className="flex items-center gap-2 self-end pb-2 text-[0.75rem] text-smoke"><input type="checkbox" name="confirm_currency" className="accent-[var(--color-purple)]" />I understand a currency change won&apos;t convert prices</label>
              {writable && <div className="sm:col-span-2"><Submit>Save settings</Submit></div>}
            </ActionForm>
          </fieldset>
        </Card>
        <div className="space-y-6">
          <Card title="Payments">
            <fieldset disabled={!writable}>
              <ActionForm action={savePaymentSettingsAction} className="space-y-3">
                {Object.values(PROVIDERS).map((p) => (
                  <label key={p.id} className="flex items-center justify-between gap-3 text-[0.8125rem]">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" name={`${p.id}_enabled`} defaultChecked={pay[`${p.id}_enabled`] !== false} className="accent-[var(--color-purple)]" />
                      <span><span className="text-bone capitalize">{p.id}</span><span className="block text-[0.75rem] text-smoke">{p.supportsCurrency(s.currency) ? `Accepts ${s.currency}` : `Doesn't accept ${s.currency}`} · webhook {base}/api/webhooks/{p.id}</span></span>
                    </span>
                    <Badge value={p.isConfigured() ? "active" : "disabled"} label={p.isConfigured() ? "keys set" : "no keys"} />
                  </label>
                ))}
                <Field label="Offline payment methods" hint="Comma-separated. Staff pick one when recording a payment on an order.">
                  <input name="manual_methods" defaultValue={pay.manual_methods.join(", ")} className="adm-input" />
                </Field>
                {writable && <Submit variant="ghost">Save</Submit>}
              </ActionForm>
            </fieldset>
          </Card>
          <Card title="Integrations">
            <ul className="divide-y divide-bone/[0.07]">
              <Integration name="Database" ok={Boolean(process.env.DATABASE_URL)} detail="Supabase PostgreSQL (DATABASE_URL)" />
              <Integration name="Image uploads" ok={Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)} detail={`Supabase Storage bucket “${process.env.SUPABASE_STORAGE_BUCKET || "product-images"}”`} />
              <Integration name="Order emails" ok={Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)} detail="Resend (RESEND_API_KEY, EMAIL_FROM)" />
              <Integration name="Maintenance job" ok={Boolean(process.env.CRON_SECRET)} detail="GET /api/cron/maintenance with Bearer CRON_SECRET, every ~10 min" />
              <Integration name="Payment callbacks" ok={Boolean(process.env.APP_URL)} detail="APP_URL — public origin used for payment redirects" />
            </ul>
          </Card>
          <Card title="Your password">
            <ActionForm action={changeOwnPasswordAction} resetOnSuccess className="grid gap-3 sm:grid-cols-2">
              <Field label="Current password"><input name="current_password" type="password" autoComplete="current-password" required className="adm-input" /></Field>
              <Field label="New password"><input name="new_password" type="password" autoComplete="new-password" minLength={12} required className="adm-input" /></Field>
              <div><Submit variant="ghost">Change password</Submit></div>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  );
}
