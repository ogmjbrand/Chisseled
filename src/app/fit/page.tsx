import { FitQuiz } from "@/components/sections/FitQuiz";
import { JsonLd } from "@/components/primitives/JsonLd";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Find Your Performance Fit",
  description:
    "Five questions, two minutes. Get the apparel and the training programme matched to what you actually train for.",
  path: "/fit",
});

export default function FitPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Find Your Fit", path: "/fit" },
        ])}
      />
      <FitQuiz />
    </>
  );
}
