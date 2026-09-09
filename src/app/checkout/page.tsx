import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartSummaryAction } from "@/lib/shopify/actions";
import { ArrowMark } from "@/components/primitives/Marks";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Secure Checkout",
    description: "Complete your CHISSELED order. Secure payment, fast delivery, easy returns.",
    path: "/checkout",
  }),
  robots: { index: false, follow: false },
};

/**
 * There is no local checkout UI. Shopify remains responsible for checkout
 * and payment processing — this route's only job is to read the current
 * (Shopify-backed) cart and hand off to Shopify's own hosted checkout URL.
 * The previous version of this page was a fully local, self-declared
 * demonstration checkout (a fake multi-step payment form with a canned
 * "order placed" screen) — replaced outright, since building a real
 * integration and keeping a fake one side by side would leave two
 * contradictory checkouts in the same app.
 */
export default async function CheckoutPage() {
  const summary = await getCartSummaryAction();

  if (summary.error) {
    return (
      <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow mb-5">Checkout</p>
        <h1 className="display-md mb-4 text-bone">Couldn&apos;t reach the store.</h1>
        <p className="mb-8 max-w-[38ch] text-body-sm text-smoke">{summary.error}</p>
        <Link href="/checkout" className="btn btn-primary">
          Try again
          <ArrowMark className="size-4" />
        </Link>
      </div>
    );
  }

  if (summary.lines.length === 0 || !summary.checkoutUrl) {
    return (
      <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-20 text-center">
        <p className="eyebrow mb-5">Checkout</p>
        <h1 className="display-md mb-4 text-bone">Your bag is empty.</h1>
        <p className="mb-8 max-w-[34ch] text-body-sm text-smoke">
          Add something to it and this page will have work to do.
        </p>
        <Link href="/shop" className="btn btn-primary">
          Shop the collection
          <ArrowMark className="size-4" />
        </Link>
      </div>
    );
  }

  redirect(summary.checkoutUrl);
}
