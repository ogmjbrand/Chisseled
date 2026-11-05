import Link from "next/link";
import { ArrowMark } from "@/components/primitives/Marks";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { pageMetadata } from "@/lib/seo";
import { isDatabaseConfigured, db } from "@/lib/db";
import { loadCart, readCartId } from "@/lib/commerce/cart";
import { getCustomer } from "@/lib/auth/customer";
import { getStoreSettings } from "@/lib/commerce/settings";
import { availableProviders } from "@/lib/payments";
import { COUNTRIES } from "@/lib/commerce/countries";

export const dynamic = "force-dynamic";

export const metadata = {
  ...pageMetadata({
    title: "Secure Checkout",
    description: "Complete your CHISSELED order. Secure payment, fast delivery, easy returns.",
    path: "/checkout",
  }),
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  declined: "Your payment wasn't completed. Nothing was charged — you can try again.",
  payment: "We couldn't confirm that payment. If you were charged, contact us with your order number.",
  busy: "Too many attempts. Wait a moment and try again.",
};

function Empty({ title, body, cta = "Shop the collection", href = "/shop" }: { title: string; body: string; cta?: string; href?: string }) {
  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-5">Checkout</p>
      <h1 className="display-md mb-4 text-bone">{title}</h1>
      <p className="mb-8 max-w-[38ch] text-body-sm text-smoke">{body}</p>
      <Link href={href} className="btn btn-primary">
        {cta}
        <ArrowMark className="size-4" />
      </Link>
    </div>
  );
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!isDatabaseConfigured()) {
    return <Empty title="Checkout is offline." body="The store backend isn't connected right now. Please try again shortly." />;
  }
  const { error } = await searchParams;
  const cartId = await readCartId();
  const cart = cartId ? await loadCart(cartId) : null;
  if (!cart || cart.items.length === 0) {
    return <Empty title="Your bag is empty." body="Add something to it and this page will have work to do." />;
  }

  const [settings, customer] = await Promise.all([getStoreSettings(), getCustomer()]);
  const providers = await availableProviders(settings.currency);
  const [address] = customer
    ? await db()<{ first_name: string; last_name: string; company: string; line1: string; line2: string; city: string; region: string; postal_code: string; country: string; phone: string }[]>`
        select first_name, last_name, company, line1, line2, city, region, postal_code, country, phone
        from customer_addresses where customer_id = ${customer.id} order by is_default desc, created_at desc limit 1`
    : [];

  return (
    <div className="shell pb-24 pt-[calc(var(--nav-h)+2.5rem)]">
      <p className="eyebrow mb-4">Secure checkout</p>
      <h1 className="display-md mb-10 text-bone">Complete your order.</h1>
      {error && ERRORS[error] && (
        <p role="alert" className="mb-8 border border-bone/15 bg-carbon px-5 py-4 text-body-sm" style={{ color: "var(--color-signal-out)" }}>
          {ERRORS[error]}
        </p>
      )}
      <CheckoutForm
        currency={settings.currency}
        defaultCountry={address?.country ?? settings.country}
        countries={COUNTRIES}
        providers={providers.map((p) => ({ id: p.id, label: p.label }))}
        signedIn={Boolean(customer)}
        prefill={{
          email: customer?.email ?? cart.email ?? "",
          firstName: address?.first_name ?? customer?.firstName ?? "",
          lastName: address?.last_name ?? customer?.lastName ?? "",
          phone: address?.phone ?? customer?.phone ?? "",
          company: address?.company ?? "",
          line1: address?.line1 ?? "",
          line2: address?.line2 ?? "",
          city: address?.city ?? "",
          region: address?.region ?? "",
          postalCode: address?.postal_code ?? "",
          discountCode: cart.discountCode ?? "",
        }}
        items={cart.items.map((i) => ({
          id: i.id,
          name: i.name,
          variant: i.variantTitle === "Default" ? "" : i.variantTitle,
          quantity: i.quantity,
          totalCents: i.unitPriceCents * i.quantity,
          imageUrl: i.imageUrl,
          problem: i.purchasable ? null : i.available && i.available > 0 ? `Only ${i.available} left` : "Sold out",
        }))}
      />
    </div>
  );
}
