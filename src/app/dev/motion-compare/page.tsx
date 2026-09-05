import { Sequence } from "@/components/sections/Sequence";
import { SequenceGsapThree } from "@/components/sections/SequenceGsapThree";

/**
 * DEV-ONLY COMPARISON — not linked from any nav, not part of the storefront.
 * Answers "what would GSAP + Three look like" by putting the real production
 * Sequence next to a GSAP + Three.js prototype of the same three stages, so
 * the two can be scrolled and judged side by side before deciding whether to
 * bring either library into the main dependency set.
 */
export const metadata = {
  robots: { index: false, follow: false },
};

export default function MotionComparePage() {
  return (
    <>
      <div className="border-b border-bone/10 bg-ink px-6 py-14 text-center text-bone">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-purple-bright">
          Prototype comparison — not linked from navigation
        </p>
        <h1 className="display-lg mt-4">A — Current build</h1>
        <p className="lede mx-auto mt-3 max-w-[52ch] text-fog">
          Zero extra dependencies. Hand-written scroll math + CSS transforms + real photography.
        </p>
      </div>

      <Sequence />

      <div className="border-y border-bone/10 bg-ink px-6 py-14 text-center text-bone">
        <h1 className="display-lg">B — GSAP + Three.js prototype</h1>
        <p className="lede mx-auto mt-3 max-w-[52ch] text-fog">
          Adds `gsap` (ScrollTrigger) for the pin/scrub and `three` for a real WebGL camera and
          particle field. Same three stages, same photography.
        </p>
      </div>

      <SequenceGsapThree />

      <div className="bg-ink px-6 py-24 text-center text-bone">
        <p className="lede mx-auto max-w-[50ch] text-fog">End of comparison.</p>
      </div>
    </>
  );
}
