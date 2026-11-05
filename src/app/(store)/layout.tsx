import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { CartDrawer } from "@/components/shell/CartDrawer";
import { SearchOverlay } from "@/components/shell/SearchOverlay";
import { Assistant } from "@/components/assistant/Assistant";
import { RevealRoot } from "@/components/shell/RevealRoot";
import { GrainDefs } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { StoreProvider } from "@/lib/store";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getEnrichedProductsByHandles, getRealProductHandles } from "@/lib/commerce/catalog";

/**
 * Every page reads live catalogue, cart and stock data, so nothing is
 * prerendered with build-time data: admin changes appear on the next request.
 */
export const dynamic = "force-dynamic";

/**
 * "Complete your performance kit" — real, addable product slugs. Kept here
 * (fetched once per request, cached like every other catalogue read) rather
 * than in the local catalogue, since a local slug has no guarantee of
 * existing in the connected store.
 */
const CART_KIT_HANDLES = [
  "weight-lifting-gloves-fitness-gloves-pair",
  "sport-liquid-chalk",
  "multifunctional-waterproof-large-gym-bag",
  "abdominal-wheel-muscle-roller-ab-wheel-roller",
  "bodybuilding-muscle-relaxation-fitness-pvc-4-touch-hand-roller-massager",
  "protein-nutritional-supplement",
];

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const kitProducts = await getEnrichedProductsByHandles(CART_KIT_HANDLES);
  // Passed to SearchOverlay so it only links search results through to a
  // product page that actually exists — a Set isn't serialisable across the
  // Server/Client boundary, so this crosses as a plain array.
  const realProductHandles = [...(await getRealProductHandles())];

  return (
    <>
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <StoreProvider>
        <RevealRoot />
        <GrainDefs />
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <CartDrawer kitProducts={kitProducts} />
        <SearchOverlay realProductHandles={realProductHandles} />
        <Assistant />
      </StoreProvider>
    </>
  );
}
