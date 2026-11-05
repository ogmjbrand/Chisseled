import Link from "next/link";
import { db } from "@/lib/db";
import { guard, pageNumber } from "@/lib/admin/guard";
import { Badge, Card, Empty, Forbidden, PageHeader, Pagination, Table, fmtDate } from "@/components/admin/ui";
import { getStoreSettings, orderName } from "@/lib/commerce/settings";

export const metadata = { title: "Inventory history" };
const PER = 50;

export default async function History({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  if (!(await guard("inventory:read"))) return <Forbidden />;
  const page = pageNumber((await searchParams).page);
  const settings = await getStoreSettings();
  const [rows, [{ total }]] = await Promise.all([
    db()<{ id: number; created_at: Date; reason: string; delta_on_hand: number; delta_reserved: number; on_hand_after: number; reserved_after: number; note: string; product: string; variant: string; product_id: string; order_id: string | null; order_number: number | null; staff: string | null }[]>`
      select m.id, m.created_at, m.reason, m.delta_on_hand, m.delta_reserved, m.on_hand_after, m.reserved_after, m.note,
             p.title as product, v.title as variant, p.id as product_id, m.order_id, o.number as order_number, s.name as staff
      from inventory_movements m join product_variants v on v.id = m.variant_id join products p on p.id = v.product_id
      left join orders o on o.id = m.order_id left join staff_users s on s.id = m.staff_id
      order by m.created_at desc, m.id desc limit ${PER} offset ${(page - 1) * PER}`,
    db()<{ total: number }[]>`select count(*)::int as total from inventory_movements`,
  ]);
  const sign = (n: number) => (n > 0 ? `+${n}` : String(n));
  return (
    <>
      <PageHeader title="Inventory history" back={{ href: "/admin/inventory", label: "Inventory" }} description="Every stock change, with who or what caused it." />
      <Card pad={false}>
        <Table head={["When", "Product", "Reason", "On hand", "Reserved", "Source"]} empty={rows.length === 0 ? <Empty title="No stock movements yet." /> : null}>
          {rows.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap">{fmtDate(m.created_at, true)}</td>
              <td><Link href={`/admin/products/${m.product_id}`} className="row-link">{m.product}</Link>{m.variant !== "Default" && <span className="block text-[0.75rem] text-smoke">{m.variant}</span>}</td>
              <td><Badge value="info" label={m.reason.replace(/_/g, " ")} />{m.note && <span className="block text-[0.75rem] text-smoke">{m.note}</span>}</td>
              <td className="num">{m.delta_on_hand !== 0 && <span className="text-smoke">{sign(m.delta_on_hand)} → </span>}{m.on_hand_after}</td>
              <td className="num">{m.delta_reserved !== 0 && <span className="text-smoke">{sign(m.delta_reserved)} → </span>}{m.reserved_after}</td>
              <td>{m.order_id ? <Link href={`/admin/orders/${m.order_id}`} className="row-link">{orderName(m.order_number ?? 0, settings.order_prefix)}</Link> : m.staff ?? "System"}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={Math.ceil(total / PER)} href={(p) => `/admin/inventory/history?page=${p}`} />
      </Card>
    </>
  );
}
