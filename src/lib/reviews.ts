import type { Review } from "@/lib/types";

/**
 * Review copy is authored per product family rather than generated, so the
 * fit notes and body text stay specific enough to be genuinely useful.
 * Ratings here are illustrative sample data for the storefront; production
 * must render only verified purchase reviews from the live review store.
 */

type Family = "leggings" | "bra" | "top" | "shorts" | "outer" | "access" | "fuel";

const POOL: Record<Family, Omit<Review, "id">[]> = {
  leggings: [
    {
      author: "Amara O.",
      rating: 5,
      title: "They do not move. At all.",
      body:
        "Squatted heavy three times this week and never once reached down to pull them up. The waistband sits exactly where you put it. Opaque under gym lighting, which was the whole reason I bought them.",
      date: "2026-06-14",
      verified: true,
      fitNote: "True to size",
      height: "5'7\"",
      sizeWorn: "M",
    },
    {
      author: "Ruth A.",
      rating: 5,
      title: "Worth the price jump",
      body:
        "I have four cheaper pairs that pill after a month. Six months in these still look new. The seam placement down the back of the leg genuinely flatters.",
      date: "2026-05-02",
      verified: true,
      fitNote: "True to size",
      height: "5'4\"",
      sizeWorn: "S",
    },
    {
      author: "Ifeoma N.",
      rating: 4,
      title: "Great, size up if you're between",
      body:
        "Compression is real compression. I'm normally an M and went M — it's snug for the first ten minutes then settles. If you want a softer feel take the L.",
      date: "2026-04-19",
      verified: true,
      fitNote: "Runs small",
      height: "5'9\"",
      sizeWorn: "M",
    },
  ],
  bra: [
    {
      author: "Zainab K.",
      rating: 5,
      title: "Finally, a high-impact bra that isn't a corset",
      body:
        "Ran 12k in it and had zero movement, but I could still breathe deeply. The underband is wide enough to spread the load instead of digging in.",
      date: "2026-06-28",
      verified: true,
      fitNote: "True to size",
      height: "5'6\"",
      sizeWorn: "M",
    },
    {
      author: "Chidinma E.",
      rating: 5,
      title: "Support without the flatten",
      body:
        "Most high-support bras crush you. This one holds shape. Straps stayed put through overhead work.",
      date: "2026-05-21",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "L",
    },
    {
      author: "Halima B.",
      rating: 4,
      title: "Excellent, slight break-in",
      body:
        "First two wears felt tight across the back. Settled after washing. Now it's the one I reach for.",
      date: "2026-03-30",
      verified: true,
      fitNote: "Runs small",
      sizeWorn: "S",
    },
  ],
  top: [
    {
      author: "Tunde A.",
      rating: 5,
      title: "The fabric is the difference",
      body:
        "Doesn't cling when you sweat through it, which is the only thing I actually care about. Cut is athletic without being a compression sleeve.",
      date: "2026-07-02",
      verified: true,
      fitNote: "True to size",
      height: "6'0\"",
      sizeWorn: "L",
    },
    {
      author: "Emeka U.",
      rating: 5,
      title: "Bought a second one the same week",
      body:
        "Shoulder seams sit right on the deltoid so nothing binds when you press. Hem doesn't ride up on cleans.",
      date: "2026-06-09",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "M",
    },
    {
      author: "Samuel I.",
      rating: 4,
      title: "Very good, long body",
      body:
        "Runs a touch long in the torso if you're under 5'9\". Not a problem for me at 6'1\".",
      date: "2026-04-11",
      verified: true,
      fitNote: "Runs large",
      height: "6'1\"",
      sizeWorn: "L",
    },
  ],
  shorts: [
    {
      author: "David O.",
      rating: 5,
      title: "The liner is the whole point",
      body:
        "No chafe over 15k. Pockets are deep enough for a phone without the swing. This is the shorts problem solved.",
      date: "2026-06-30",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "M",
    },
    {
      author: "Grace M.",
      rating: 5,
      title: "Squat-proof",
      body:
        "Checked in the mirror at depth. Completely opaque. That alone earns five stars.",
      date: "2026-05-17",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "S",
    },
    {
      author: "Femi L.",
      rating: 4,
      title: "Great cut, wish for one more colour",
      body: "Fit and fabric are excellent. Just want it in something other than the darks.",
      date: "2026-03-08",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "L",
    },
  ],
  outer: [
    {
      author: "Kelechi N.",
      rating: 5,
      title: "Warm-up layer that earns its place",
      body:
        "Light enough to train in, structured enough to wear out. The collar actually stands up instead of collapsing.",
      date: "2026-07-11",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "M",
    },
    {
      author: "Blessing A.",
      rating: 5,
      title: "Looks far more expensive than it is",
      body: "Everyone asks. The matte finish reads premium in daylight.",
      date: "2026-05-29",
      verified: true,
      fitNote: "True to size",
      sizeWorn: "S",
    },
    {
      author: "Ibrahim S.",
      rating: 4,
      title: "Roomy through the body",
      body: "Cut is intentionally relaxed. Size down if you want it close.",
      date: "2026-02-24",
      verified: true,
      fitNote: "Runs large",
      sizeWorn: "L",
    },
  ],
  access: [
    {
      author: "Nkechi V.",
      rating: 5,
      title: "Holds everything, weighs nothing",
      body:
        "Wet compartment actually keeps wet things away from the rest. Straps haven't frayed after daily use.",
      date: "2026-06-20",
      verified: true,
    },
    {
      author: "Chinedu P.",
      rating: 5,
      title: "The compression is legitimate",
      body:
        "Calves are noticeably less trashed the day after long runs. Graduated pressure, not just tight tubes.",
      date: "2026-04-30",
      verified: true,
      sizeWorn: "L",
    },
    {
      author: "Aisha D.",
      rating: 4,
      title: "Excellent build",
      body: "Small for the price if you carry shoes plus a laptop, but built to last.",
      date: "2026-03-15",
      verified: true,
    },
  ],
  fuel: [
    {
      author: "Olumide T.",
      rating: 5,
      title: "Mixes clean, no chalk",
      body:
        "Shakes up in water with no clumps, which is rare at this protein content. Sits well before early sessions.",
      date: "2026-07-04",
      verified: true,
    },
    {
      author: "Adaeze F.",
      rating: 5,
      title: "Full disclosure label sold me",
      body:
        "Every dose is listed. No proprietary blends hiding under-dosed ingredients. That transparency is why I subscribed.",
      date: "2026-05-08",
      verified: true,
    },
    {
      author: "Bashir Y.",
      rating: 4,
      title: "Works, flavour is restrained",
      body: "Not sweet, which I prefer. If you want dessert flavour this isn't it.",
      date: "2026-04-02",
      verified: true,
    },
  ],
};

export function reviewsFor(family: Family, slug: string): Review[] {
  return POOL[family].map((r, i) => ({ ...r, id: `${slug}-r${i + 1}` }));
}
