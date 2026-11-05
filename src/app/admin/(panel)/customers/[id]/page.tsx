import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { isUuid } from "@/lib/security/validate";
import { Badge, Card, Empty, Field, Forbidden, PageHeader, Stat, Table, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { addCustomerNoteAction, deleteAddressAction, updateCustomerAction } from "@/lib/admin/customer-actions";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";
import { COUNTRY_NAME } from "@/lib/commerce/countries";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await guard("customers:read");
  if (!staff) return <Forbidden />;
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const sql = db();
  const [c] = await sql<{ id: string; email: string; first_name: string; last_name: string; phone: string; tags: string[]; accepts_marketing: boolean; status: string; password_hash: string | null; created_at: Date }[]>`
    select id, email, first_name, last_name, phone, tags, accepts_marketing, status, password_hash, created_at from customers where id = ${id}`;
  if (!c) notFound();
  const [orders, addresses, notes, [stats], settings] = await Promise.all([
    sql<{ id: string; number: number; created_at: Date; total_cents: number; currency: string; payment_status: string; fulfillment_status: string; status: string }[]>`
      select id, number, created_at, total_cents, currency, payment_status, fulfillment_status, status from orders
      where customer_id = ${id} and payment_status <> 'voided' order by created_at desc limit 100`,
    sql<{ id: string; first_name: string; last_name: string; line1: string; line2: string; city: string; region: string; postal_code: string; country: string; is_default: boolean }[]>`
      select id, first_name, last_name, line1, line2, city, region, postal_code, country, is_default from customer_addresses where customer_id = ${id} order by is_default desc`,
    sql<{ id: string; body: string; created_at: Date; staff: string | null }[]>`
      select n.id, n.body, n.created_at, s.name as staff from customer_notes n left join staff_users s on s.id = n.staff_id
      where n.customer_id = ${id} order by n.created_at desc`,
    sql<{ orders: number; spent: number; first: Date | null; last: Date | null; refunds: number }[]>`
      select count(*)::int as orders, coalesce(sum(total_cents - refunded_cents),0)::bigint as spent, min(paid_at) as first, max(paid_at) as last,
             coalesce(sum(refunded_cents),0)::bigint as refunds
      from orders where customer_id = ${id} and payment_status in ('paid','partially_refunded','refunded')`,
    getStoreSettings(),
  ]);
  const writable = can(staff, "customers:write");
  const money = (n: number) => formatMoney(n, settings.currency);
  return (
    <>
      <PageHeader
        title={[c.first_name, c.last_name].filter(Boolean).join(" ") || c.email}
        back={{ href: "/admin/customers", label: "Customers" }}
        description={`${c.password_hash ? "Account" : "Guest"} since ${fmtDate(c.created_at)} · ${c.email}`}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Lifetime spend" value={money(stats.spent)} hint={stats.refunds ? `${money(stats.refunds)} refunded` : undefined} />
        <Stat label="Paid orders" value={stats.orders} />
        <Stat label="Average order" value={money(stats.orders ? Math.round(stats.spent / stats.orders) : 0)} />
        <Stat label="Last purchase" value={<span className="text-[1.125rem]">{fmtDate(stats.last)}</span>} hint={stats.first ? `first ${fmtDate(stats.first)}` : undefined} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card title="Orders" pad={false}>
            <Table head={["Order", "Date", "Payment", "Fulfilment", <span key="t" className="block text-right">Total</span>]} empty={orders.length === 0 ? <Empty title="No orders yet." /> : null}>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><Link href={`/admin/orders/${o.id}`} className="row-link">{orderName(o.number, settings.order_prefix)}</Link></td>
                  <td>{fmtDate(o.created_at)}</td>
                  <td>{o.status === "cancelled" ? <Badge value="cancelled" /> : <Badge value={o.payment_status} />}</td>
                  <td><Badge value={o.fulfillment_status} /></td>
                  <td className="num">{formatMoney(o.total_cents, o.currency)}</td>
                </tr>
              ))}
            </Table>
          </Card>
          <Card title="Notes">
            {writable && (
              <ActionForm action={addCustomerNoteAction} resetOnSuccess className="mb-4 flex gap-2">
                <input type="hidden" name="id" value={id} />
                <input name="body" required maxLength={4000} placeholder="Add a private note…" aria-label="Note" className="adm-input flex-1" />
                <Submit variant="ghost">Add</Submit>
              </ActionForm>
            )}
            {notes.length === 0 ? <p className="text-smoke">No notes.</p> : (
              <ul className="space-y-3">
                {notes.map((n) => (
                  <li key={n.id} className="text-[0.8125rem]"><p className="whitespace-pre-wrap text-bone">{n.body}</p><p className="text-[0.75rem] text-smoke">{fmtDate(n.created_at, true)}{n.staff && ` · ${n.staff}`}</p></li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card title="Profile">
            <fieldset disabled={!writable}>
              <ActionForm action={updateCustomerAction} className="space-y-3">
                <input type="hidden" name="id" value={id} />
                <div className="grid grid-cols-2 gap-2">
                  <Field label="First name"><input name="first_name" defaultValue={c.first_name} className="adm-input" /></Field>
                  <Field label="Last name"><input name="last_name" defaultValue={c.last_name} className="adm-input" /></Field>
                </div>
                <Field label="Email"><input name="email" type="email" required defaultValue={c.email} className="adm-input" /></Field>
                <Field label="Phone"><input name="phone" defaultValue={c.phone} className="adm-input" /></Field>
                <Field label="Tags" hint="Comma-separated — use for segments."><input name="tags" defaultValue={c.tags.join(", ")} className="adm-input" /></Field>
                <label className="flex items-center gap-2 text-[0.8125rem]"><input type="checkbox" name="accepts_marketing" defaultChecked={c.accepts_marketing} className="accent-[var(--color-purple)]" />Accepts marketing email</label>
                <Field label="Account status">
                  <select name="status" defaultValue={c.status} className="adm-input"><option value="active">Active</option><option value="disabled">Disabled (signs them out)</option></select>
                </Field>
                {writable && <Submit>Save customer</Submit>}
              </ActionForm>
            </fieldset>
          </Card>
          <Card title="Addresses">
            {addresses.length === 0 ? <p className="text-smoke">No saved addresses.</p> : (
              <ul className="space-y-4 text-[0.8125rem]">
                {addresses.map((a) => (
                  <li key={a.id}>
                    {a.is_default && <Badge value="info" label="default" />}
                    <p className="mt-1 leading-relaxed">{a.first_name} {a.last_name}<br />{a.line1}{a.line2 && `, ${a.line2}`}<br />{a.city}{a.region && `, ${a.region}`} {a.postal_code}<br />{COUNTRY_NAME.get(a.country) ?? a.country}</p>
                    {writable && (
                      <ActionForm action={deleteAddressAction} confirm="Remove this address?">
                        <input type="hidden" name="id" value={id} /><input type="hidden" name="address_id" value={a.id} />
                        <Submit variant="danger" className="mt-1 !px-2 !py-1 !text-[0.6875rem]">Remove</Submit>
                      </ActionForm>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
