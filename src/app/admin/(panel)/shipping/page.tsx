import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Empty, Field, Forbidden, PageHeader, Table, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { deleteRateAction, deleteZoneAction, saveRateAction, saveZoneAction } from "@/lib/admin/config-actions";
import { COUNTRIES, COUNTRY_NAME } from "@/lib/commerce/countries";
import { centsToInput, formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

export const metadata = { title: "Shipping" };

interface Rate { id: string; zone_id: string; name: string; price_cents: number; free_over_cents: number | null; min_subtotal_cents: number; days_min: number | null; days_max: number | null; active: boolean; position: number }

function RateFields({ r, zoneId }: { r?: Rate; zoneId: string }) {
  return (
    <ActionForm action={saveRateAction} resetOnSuccess={!r} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8 lg:items-end">
      {r && <input type="hidden" name="id" value={r.id} />}
      <input type="hidden" name="zone_id" value={zoneId} />
      <Field label="Name" className="col-span-2"><input name="name" required defaultValue={r?.name} placeholder="Standard" className="adm-input adm-input-sm" /></Field>
      <Field label="Price"><input name="price" inputMode="decimal" required defaultValue={r ? centsToInput(r.price_cents) : ""} className="adm-input adm-input-sm" /></Field>
      <Field label="Free over"><input name="free_over" inputMode="decimal" defaultValue={centsToInput(r?.free_over_cents)} className="adm-input adm-input-sm" /></Field>
      <Field label="Min order"><input name="min_subtotal" inputMode="decimal" defaultValue={r?.min_subtotal_cents ? centsToInput(r.min_subtotal_cents) : ""} className="adm-input adm-input-sm" /></Field>
      <Field label="Days"><span className="flex gap-1"><input name="days_min" type="number" min={0} defaultValue={r?.days_min ?? ""} aria-label="Min days" className="adm-input adm-input-sm" /><input name="days_max" type="number" min={0} defaultValue={r?.days_max ?? ""} aria-label="Max days" className="adm-input adm-input-sm" /></span></Field>
      <label className="flex items-center gap-1.5 pb-1.5 text-[0.75rem]"><input type="checkbox" name="active" defaultChecked={r?.active ?? true} className="accent-[var(--color-purple)]" />Active</label>
      <Submit variant={r ? "ghost" : "primary"} className="!py-1.5">{r ? "Save" : "Add rate"}</Submit>
    </ActionForm>
  );
}

export default async function Shipping() {
  const staff = await guard("shipping:read");
  if (!staff) return <Forbidden />;
  const settings = await getStoreSettings();
  const [zones, rates, shipments] = await Promise.all([
    db()<{ id: string; name: string; countries: string[]; is_rest_of_world: boolean }[]>`select id, name, countries, is_rest_of_world from shipping_zones order by is_rest_of_world, name`,
    db()<Rate[]>`select * from shipping_rates order by position, price_cents`,
    db()<{ id: string; order_id: string; number: number; status: string; carrier: string; tracking_number: string; shipped_at: Date | null; delivered_at: Date | null }[]>`
      select s.id, s.order_id, o.number, s.status, s.carrier, s.tracking_number, s.shipped_at, s.delivered_at
      from shipments s join orders o on o.id = s.order_id order by s.created_at desc limit 25`,
  ]);
  const writable = can(staff, "shipping:write");
  const money = (n: number) => formatMoney(n, settings.currency);
  const zoneForm = (z?: (typeof zones)[number]) => (
    <ActionForm action={saveZoneAction} resetOnSuccess={!z} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
      {z && <input type="hidden" name="id" value={z.id} />}
      <Field label="Zone name"><input name="name" required defaultValue={z?.name} placeholder="Domestic" className="adm-input" /></Field>
      <Field label="Countries" hint="Ctrl/⌘-click to choose several.">
        <select name="countries" multiple defaultValue={z?.countries.map((c) => c.trim())} className="adm-input h-24">
          {COUNTRIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
        </select>
      </Field>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[0.75rem]"><input type="checkbox" name="is_rest_of_world" defaultChecked={z?.is_rest_of_world} className="accent-[var(--color-purple)]" />Rest of world</label>
        <Submit>{z ? "Save zone" : "Create zone"}</Submit>
      </div>
    </ActionForm>
  );

  return (
    <>
      <PageHeader title="Shipping" description="Checkout offers the active rates of the zone containing the shopper's country, or the rest-of-world zone. Zones are exclusive: a country lives in one zone." />
      {zones.length === 0 && <div className="adm-card mb-6 p-4 text-[0.8125rem] text-[var(--adm-warn)]">No shipping zones yet — checkout is blocked until at least one zone has an active rate.</div>}
      <div className="space-y-6">
        {zones.map((z) => (
          <Card key={z.id} title={z.name} actions={<span className="text-[0.75rem] text-smoke">{z.is_rest_of_world ? "All other countries" : z.countries.map((c) => COUNTRY_NAME.get(c.trim()) ?? c).join(", ")}</span>}>
            <div className="space-y-4">
              {rates.filter((r) => r.zone_id === z.id).length === 0 && <p className="text-[0.8125rem] text-[var(--adm-warn)]">No rates — shoppers in this zone can&apos;t check out.</p>}
              {rates.filter((r) => r.zone_id === z.id).map((r) => (
                <div key={r.id} className="rounded-lg border border-bone/[0.07] p-3">
                  <p className="mb-2 text-[0.8125rem]"><span className="text-bone">{r.name}</span> · {r.price_cents ? money(r.price_cents) : "Free"}{r.free_over_cents ? ` · free over ${money(r.free_over_cents)}` : ""} {!r.active && <Badge value="disabled" />}</p>
                  {writable && (
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="flex-1"><RateFields r={r} zoneId={z.id} /></div>
                      <ActionForm action={deleteRateAction} confirm="Delete this rate?"><input type="hidden" name="id" value={r.id} /><Submit variant="danger" className="!py-1.5">Delete</Submit></ActionForm>
                    </div>
                  )}
                </div>
              ))}
              {writable && (
                <details className="rounded-lg border border-dashed border-bone/[0.12] p-3">
                  <summary className="cursor-pointer text-[0.8125rem] text-purple-bright">Add a rate</summary>
                  <div className="mt-3"><RateFields zoneId={z.id} /></div>
                </details>
              )}
              {writable && (
                <details>
                  <summary className="cursor-pointer text-[0.75rem] text-smoke">Edit zone</summary>
                  <div className="mt-3 space-y-3">
                    {zoneForm(z)}
                    <ActionForm action={deleteZoneAction} confirm="Delete this zone and its rates?"><input type="hidden" name="id" value={z.id} /><Submit variant="danger">Delete zone</Submit></ActionForm>
                  </div>
                </details>
              )}
            </div>
          </Card>
        ))}
        {writable && <Card title="New zone">{zoneForm()}</Card>}
        <Card title="Recent shipments" pad={false}>
          <Table head={["Order", "Shipped", "Carrier", "Tracking", "Status", "Delivered"]} empty={shipments.length === 0 ? <Empty title="Nothing shipped yet." /> : null}>
            {shipments.map((s) => (
              <tr key={s.id}>
                <td><Link href={`/admin/orders/${s.order_id}`} className="row-link">{orderName(s.number, settings.order_prefix)}</Link></td>
                <td>{fmtDate(s.shipped_at, true)}</td>
                <td>{s.carrier || "—"}</td>
                <td className="font-mono text-[0.75rem]">{s.tracking_number || "—"}</td>
                <td><Badge value={s.status} /></td>
                <td>{fmtDate(s.delivered_at)}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
