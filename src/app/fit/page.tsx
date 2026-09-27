import { FitQuiz } from "@/components/sections/FitQuiz";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { getRealProductHandles } from "@/lib/shopify/catalog";

export const metadata = pageMetadata({
  title: "Find Your Performance Fit",
  description:
    "Five questions, two minutes. Get the apparel and the training programme matched to what you actually train for.",
  path: "/fit",
});

export default async function FitPage() {
  // The quiz scores against the full local catalogue (rich activity/fit/
  // collection tags Shopify doesn't carry), but only real, purchasable
  // Shopify products should render as a shoppable ProductCard at the end.
  const realProductHandles = [...(await getRealProductHandles())];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Find Your Fit", path: "/fit" },
        ])}
      />
      <FitQuiz realProductHandles={realProductHandles} />
    </>
  );
}
