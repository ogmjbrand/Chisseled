import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { Forbidden, PageHeader } from "@/components/admin/ui";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";
import { createManualOrderAction } from "@/lib/admin/order-actions";
import { COUNTRIES } from "@/lib/commerce/countries";
import { formatMoney } from "@/lib/commerce/money";
import { getStoreSettings } from "@/lib/commerce/settings";

export const metadata = { title: "Create order" };

export default async function NewOrder() {
  if (!(await guard("orders:write"))) return <Forbidden />;
  const settings = await getStoreSettings();
  const variants = await db()<{ id: string; product: string; variant: string; sku: string | null; price_cents: number; track_inventory: boolean; available: number | null }[]>`
    select v.id, p.title as product, v.title as variant, v.sku, v.price_cents, v.track_inventory, (i.on_hand - i.reserved)::int as available
    from product_variants v join products p on p.id = v.product_id left join inventory i on i.variant_id = v.id
    where p.status = 'active' order by p.title, v.position limit 2000`;
  return (
    <>
      <PageHeader
        title="Create order"
        back={{ href: "/admin/orders", label: "Orders" }}
        description="For phone, WhatsApp, Instagram or in-person sales. After creating it, record an offline payment or send the customer a payment link."
      />
      <ManualOrderForm
        action={createManualOrderAction}
        countries={COUNTRIES}
        defaultCountry={settings.country}
        variants={variants.map((v) => ({
          id: v.id,
          label: `${v.product}${v.variant !== "Default" ? ` — ${v.variant}` : ""}${v.sku ? ` (${v.sku})` : ""} · ${formatMoney(v.price_cents, settings.currency)}`,
          available: v.track_inventory ? Math.max(0, v.available ?? 0) : null,
        }))}
      />
    </>
  );
}
