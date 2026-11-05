import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Empty, Field, Forbidden, PageHeader, Stat, Table, fmtDate, ExportLink } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { deleteCampaignAction, remindCartAction, saveCampaignAction } from "@/lib/admin/config-actions";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Marketing" };

const SEGMENTS = { subscribers: "Subscribed", all: "All customers", buyers: "Purchasers", repeat: "Repeat", vip: "VIP", at_risk: "At risk", prospects: "No purchase" } as const;

interface Campaign { id: string; name: string; channel: string; status: string; segment: string; discount_id: string | null; starts_at: Date | null; ends_at: Date | null; notes: string; code: string | null; orders: number; revenue: number }

const local = (d: Date | null) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export default async function Marketing() {
  const staff = await guard("marketing:read");
  if (!staff) return <Forbidden />;
  const settings = await getStoreSettings();
  const [campaigns, discounts, carts, [stats], demand] = await Promise.all([
    db()<Campaign[]>`
      select c.*, d.code,
        (select count(*)::int from discount_redemptions r join orders o on o.id = r.order_id where r.discount_id = c.discount_id and o.payment_status in ('paid','partially_refunded','refunded')) as orders,
        (select coalesce(sum(o.total_cents),0)::bigint from discount_redemptions r join orders o on o.id = r.order_id where r.discount_id = c.discount_id and o.payment_status in ('paid','partially_refunded','refunded')) as revenue
      from marketing_campaigns c left join discounts d on d.id = c.discount_id order by c.created_at desc`,
    db()<{ id: string; code: string | null; title: string }[]>`select id, code, title from discounts where status = 'active' order by created_at desc`,
    db()<{ id: string; email: string | null; updated_at: Date; items: number; value: number; reminder_sent_at: Date | null; subscribed: boolean | null }[]>`
      select c.id, c.email, c.updated_at, c.reminder_sent_at,
             (select sum(quantity)::int from cart_items where cart_id = c.id) as items,
             (select coalesce(sum(ci.quantity * v.price_cents),0)::bigint from cart_items ci join product_variants v on v.id = ci.variant_id where ci.cart_id = c.id) as value,
             (select accepts_marketing from customers where email = c.email) as subscribed
      from carts c where c.status = 'abandoned' and exists (select 1 from cart_items where cart_id = c.id)
      order by c.updated_at desc limit 50`,
    db()<{ subscribers: number; abandoned: number; abandoned_value: number }[]>`
      select (select count(*)::int from newsletter_subscribers where status = 'subscribed') as subscribers,
             (select count(*)::int from carts where status = 'abandoned' and updated_at > now() - interval '30 days') as abandoned,
             (select coalesce(sum(ci.quantity * v.price_cents),0)::bigint from carts c join cart_items ci on ci.cart_id = c.id join product_variants v on v.id = ci.variant_id
              where c.status = 'abandoned' and c.updated_at > now() - interval '30 days') as abandoned_value`,
    db()<{ product_id: string; title: string; variant: string | null; waiting: number }[]>`
      select p.id as product_id, p.title, v.title as variant, count(*)::int as waiting
      from stock_alerts a join products p on p.id = a.product_id left join product_variants v on v.id = a.variant_id
      where a.notified_at is null group by p.id, p.title, v.title order by waiting desc limit 20`,
  ]);
  const writable = can(staff, "marketing:write");
  const money = (n: number) => formatMoney(n, settings.currency);
  const form = (c?: Campaign) => (
    <ActionForm action={saveCampaignAction} resetOnSuccess={!c} className="grid gap-3 sm:grid-cols-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Name" className="sm:col-span-2"><input name="name" required defaultValue={c?.name} className="adm-input" /></Field>
      <Field label="Channel"><select name="channel" defaultValue={c?.channel ?? "email"} className="adm-input"><option value="email">Email</option><option value="sms">SMS</option><option value="social">Social</option><option value="other">Other</option></select></Field>
      <Field label="Audience"><select name="segment" defaultValue={c?.segment ?? "subscribers"} className="adm-input">{Object.entries(SEGMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
      <Field label="Linked discount" hint="Attribution comes from its redemptions."><select name="discount_id" defaultValue={c?.discount_id ?? ""} className="adm-input"><option value="">None</option>{discounts.map((d) => <option key={d.id} value={d.id}>{d.code ?? d.title}</option>)}</select></Field>
      <Field label="Status"><select name="status" defaultValue={c?.status ?? "draft"} className="adm-input"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="active">Active</option><option value="completed">Completed</option></select></Field>
      <Field label="Starts"><input type="datetime-local" name="starts_at" defaultValue={local(c?.starts_at ?? null)} className="adm-input" /></Field>
      <Field label="Ends"><input type="datetime-local" name="ends_at" defaultValue={local(c?.ends_at ?? null)} className="adm-input" /></Field>
      <Field label="Notes / brief" className="sm:col-span-3"><textarea name="notes" rows={2} defaultValue={c?.notes} className="adm-input" /></Field>
      <div><Submit>{c ? "Save campaign" : "Create campaign"}</Submit></div>
    </ActionForm>
  );
  return (
    <>
      <PageHeader title="Marketing" description="Plan campaigns, attribute them through linked discount codes, and recover abandoned carts." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Newsletter subscribers" value={stats.subscribers} hint={<ExportLink kind="subscribers" className="text-purple-bright" />} />
        <Stat label="Abandoned carts · 30 days" value={stats.abandoned} />
        <Stat label="Value left in carts" value={money(stats.abandoned_value)} />
      </div>
      <div className="space-y-6">
        <Card title="Campaigns" pad={false}>
          {campaigns.length === 0 ? <Empty title="No campaigns yet." /> : (
            <ul className="divide-y divide-bone/[0.07]">
              {campaigns.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <details>
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
                      <span><span className="text-bone">{c.name}</span><span className="ml-2 text-[0.75rem] text-smoke capitalize">{c.channel} · {SEGMENTS[c.segment as keyof typeof SEGMENTS] ?? c.segment}{c.code && ` · code ${c.code}`} · {c.orders} orders · {money(c.revenue)}</span></span>
                      <Badge value={c.status} />
                    </summary>
                    {writable && <div className="mt-4 space-y-3">{form(c)}<ActionForm action={deleteCampaignAction} confirm="Delete this campaign?"><input type="hidden" name="id" value={c.id} /><Submit variant="danger">Delete</Submit></ActionForm></div>}
                  </details>
                </li>
              ))}
            </ul>
          )}
        </Card>
        {writable && <Card title="New campaign">{form()}</Card>}
        <Card title="Waiting for restock" pad={false}>
          <Table head={["Product", "Size / variant", <span key="w" className="block text-right">Shoppers waiting</span>]} empty={demand.length === 0 ? <Empty title="No pending back-in-stock alerts." /> : null}>
            {demand.map((d) => (
              <tr key={`${d.product_id}-${d.variant}`}>
                <td><a href={`/admin/products/${d.product_id}`} className="row-link">{d.title}</a></td>
                <td>{d.variant && d.variant !== "Default" ? d.variant : "Any"}</td>
                <td className="num">{d.waiting}</td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="Abandoned carts" pad={false}>
          <Table head={["Email", "Last activity", "Items", "Value", "Opt-in", ""]} empty={carts.length === 0 ? <Empty title="No abandoned carts.">Carts with an email that sit idle for an hour appear here (the maintenance job marks them).</Empty> : null}>
            {carts.map((c) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td>{fmtDate(c.updated_at, true)}</td>
                <td>{c.items}</td>
                <td className="num">{money(c.value)}</td>
                <td>{c.subscribed ? "Yes" : <span className="text-ash">No</span>}</td>
                <td className="text-right">
                  {c.reminder_sent_at ? <span className="text-[0.75rem] text-smoke">Reminded {fmtDate(c.reminder_sent_at)}</span> : writable && c.subscribed && (
                    <ActionForm action={remindCartAction}><input type="hidden" name="id" value={c.id} /><Submit variant="ghost" className="!px-2 !py-1 !text-[0.75rem]">Send reminder</Submit></ActionForm>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
