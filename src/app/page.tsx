import { Hero } from "@/components/sections/Hero";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { ShopByCollection } from "@/components/sections/ShopByCollection";
import { FeaturedCollection } from "@/components/sections/FeaturedCollection";
import { GenderEditorial } from "@/components/sections/GenderEditorial";
import { Method } from "@/components/sections/Method";
import { TrainingPlatform } from "@/components/sections/TrainingPlatform";
import { FuelSection } from "@/components/sections/FuelSection";
import { Bundles } from "@/components/sections/Bundles";
import { SocialProof } from "@/components/sections/SocialProof";
import { Community } from "@/components/sections/Community";
import { JournalStrip } from "@/components/sections/JournalStrip";
import { Sequence } from "@/components/sections/Sequence";
import { Marquee } from "@/components/sections/Marquee";

/**
 * The homepage is a directed sequence, not a stack of blocks. It moves:
 * arrival → philosophy → navigation → product → gendered collections → method
 * → platform → nutrition → systems → proof → people → ideas → the
 * signature transformation → close.
 */
export default function HomePage() {
  return (
    <>
      <Hero />

      <BrandStatement />

      <Marquee
        items={[
          "Look Chisseled",
          "Move Chisseled",
          "Live Chisseled",
          "Built for the Disciplined",
        ]}
      />

      <ShopByCollection />

      <FeaturedCollection />

      <GenderEditorial
        gender="women"
        index="04"
        headline="Power looks good on you."
        body="Designed on one block, so the Axis, the Meridian and the Shift line up at every seam. Compression that holds without squeezing, and opacity guaranteed at depth — checked under direct light before any colourway ships."
        tone="apparel"
        pose="front"
      />

      <GenderEditorial
        gender="men"
        index="05"
        headline="Built for the work."
        body="Fabric engineered at the fibre so a soaked tee still releases from the skin, shoulder seams that land on the deltoid, and a liner with no inner-thigh seam. The unglamorous problems, actually solved."
        tone="void"
        pose="back"
        flip
      />

      <Method />

      <TrainingPlatform />

      <FuelSection />

      <Bundles />

      <Marquee
        items={["Wear it", "Train in it", "Live it", "Become Chisseled"]}
        accent
      />

      {/* The signature moment */}
      <Sequence />

      <SocialProof />

      <Community />

      <JournalStrip />
    </>
  );
}
