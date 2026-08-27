import { CheckoutFlow } from "@/components/shell/CheckoutFlow";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Secure Checkout",
    description: "Complete your CHISSELED order. Secure payment, fast delivery, easy returns.",
    path: "/checkout",
  }),
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutFlow />;
}
