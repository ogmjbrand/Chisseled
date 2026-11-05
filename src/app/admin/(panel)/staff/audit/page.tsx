import { db } from "@/lib/db";
import { guard, likePattern, pageNumber } from "@/lib/admin/guard";
import { Card, Empty, Filters, Forbidden, PageHeader, Pagination, Table, fmtDate } from "@/components/admin/ui";

export const metadata = { title: "Audit log" };
const PER = 50;

export default async function Audit({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  if (!(await guard("audit:read"))) return <Forbidden />;
  const sp = await searchParams;
  const page = pageNumber(sp.page);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const where = db()`where (${q} = '' or action ilike ${likePattern(q)} or actor ilike ${likePattern(q)} or entity_id = ${q})`;
  const [rows, [{ total }]] = await Promise.all([
    db()<{ id: number; created_at: Date; actor: string; action: string; entity_type: string; entity_id: string; changes: Record<string, unknown>; ip: string | null }[]>`
      select id, created_at, actor, action, entity_type, entity_id, changes, ip from audit_logs ${where}
      order by created_at desc, id desc limit ${PER} offset ${(page - 1) * PER}`,
    db()<{ total: number }[]>`select count(*)::int as total from audit_logs ${where}`,
  ]);
  return (
    <>
      <PageHeader title="Audit log" back={{ href: "/admin/staff", label: "Staff & permissions" }} description="Append-only record of sign-ins and every administrative change." />
      <Card pad={false}>
        <Filters action="/admin/staff/audit"><input name="q" defaultValue={q} placeholder="Action, person or record id" aria-label="Search audit log" className="adm-input max-w-xs" /></Filters>
        <Table head={["When", "Who", "Action", "Record", "Details", "IP"]} empty={rows.length === 0 ? <Empty title="Nothing logged." /> : null}>
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap">{fmtDate(r.created_at, true)}</td>
              <td>{r.actor}</td>
              <td className="font-mono text-[0.75rem] text-bone">{r.action}</td>
              <td className="text-[0.75rem]">{r.entity_type}<span className="block max-w-[10rem] truncate font-mono text-smoke">{r.entity_id}</span></td>
              <td className="max-w-[22rem]"><code className="block truncate text-[0.6875rem] text-smoke" title={JSON.stringify(r.changes)}>{Object.keys(r.changes).length ? JSON.stringify(r.changes) : "—"}</code></td>
              <td className="font-mono text-[0.6875rem]">{r.ip ?? "—"}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => `/admin/staff/audit?${new URLSearchParams({ ...(q && { q }), page: String(p) })}`} />
      </Card>
    </>
  );
}
