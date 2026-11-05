import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { Badge, Card, Empty, Forbidden, PageHeader, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { markNotificationsAction } from "@/lib/admin/staff-actions";

export const metadata = { title: "Notifications" };

const LINK: Record<string, (id: string) => string> = { order: (id) => `/admin/orders/${id}`, product: (id) => `/admin/products/${id}` };

export default async function Notifications() {
  if (!(await guard("notifications:read"))) return <Forbidden />;
  const rows = await db()<{ id: string; kind: string; severity: string; title: string; body: string; entity_type: string | null; entity_id: string | null; read_at: Date | null; created_at: Date }[]>`
    select id, kind, severity, title, body, entity_type, entity_id, read_at, created_at from notifications order by read_at nulls first, created_at desc limit 200`;
  const unread = rows.filter((r) => !r.read_at).length;
  return (
    <>
      <PageHeader
        title="Notifications"
        description="New orders, low and out-of-stock variants, payment mismatches, failed refunds and staff changes."
        actions={unread > 0 && <ActionForm action={markNotificationsAction}><Submit variant="ghost">Mark all read</Submit></ActionForm>}
      />
      <Card pad={false}>
        {rows.length === 0 ? <Empty title="Nothing yet." /> : (
          <ul className="divide-y divide-bone/[0.07]">
            {rows.map((n) => {
              const href = n.entity_type && n.entity_id && LINK[n.entity_type]?.(n.entity_id);
              return (
                <li key={n.id} className={`flex flex-wrap items-start justify-between gap-3 px-5 py-3.5 ${n.read_at ? "opacity-60" : ""}`}>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-bone">{!n.read_at && <span className="size-1.5 rounded-full bg-purple-bright" aria-label="Unread" />}{href ? <Link href={href} className="hover:text-purple-bright">{n.title}</Link> : n.title}</p>
                    {n.body && <p className="text-[0.8125rem] text-smoke">{n.body}</p>}
                    <p className="text-[0.6875rem] text-ash">{fmtDate(n.created_at, true)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={n.severity} />
                    {!n.read_at && <ActionForm action={markNotificationsAction}><input type="hidden" name="id" value={n.id} /><Submit variant="ghost" className="!px-2 !py-1 !text-[0.6875rem]">Mark read</Submit></ActionForm>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
