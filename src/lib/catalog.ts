import { reviewsFor } from "@/lib/reviews";
import type { Article, Athlete, Bundle, Product, Program, WorldSlug } from "@/lib/types";

/**
 * The CHISSELED catalogue.
 *
 * NOTE FOR PRODUCTION: prices, stock, ratings and review counts here are
 * illustrative storefront data. Wire `getProducts` to the commerce backend
 * and the rest of the application will follow without further changes —
 * every surface reads through the accessors at the bottom of this file.
 */

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const ACCESSORY_SIZES = ["One Size"];
const SOCK_SIZES = ["S/M", "L/XL"];

export const PRODUCTS: Product[] = [
  /* ================= WOMEN ================= */
  {
    slug: "axis-sculpt-legging",
    name: "Axis Sculpt Legging",
    tagline: "Seamed to follow the line of the leg, engineered not to move.",
    world: "women",
    gender: "women",
    category: "Leggings",
    price: 68000,
    flat: "leggings",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL", "XXL"], low: ["XXL"] },
      { colorway: "emerald", inStock: ["S", "M", "L", "XL"], low: ["S", "XL"] },
      { colorway: "clay", inStock: ["XS", "S", "M", "L"], low: [] },
      { colorway: "storm", inStock: ["S", "M", "L", "XL", "XXL"], low: ["XXL"] },
    ],
    activities: ["lifting", "training", "everyday"],
    fit: "sculpt",
    badges: ["Signature"],
    story:
      "The Axis began as a construction problem. Most leggings place a seam down the centre back because it is cheap to sew, then rely on compression to hold everything in place. We moved the seam off-centre, following the actual line of the hamstring, and let the panel geometry do the shaping instead of the fabric tension. The result holds without squeezing, and it holds at hour four the same way it holds at minute one.",
    benefits: [
      { title: "Locked waistband", detail: "A 12cm bonded band with a silicone inner track. No fold, no descent, no reaching down mid-set." },
      { title: "Opacity guaranteed", detail: "Every colourway is squat-tested at depth under direct light before it ships. If it reads through, it does not ship." },
      { title: "Anatomical seaming", detail: "Panels follow the hamstring and adductor rather than the sewing machine's convenience." },
      { title: "Four-hour comfort", detail: "Flatlocked throughout, so nothing abrades on the twentieth rep or the twelfth kilometre." },
    ],
    fabric: "72% recycled polyamide, 28% elastane. 280gsm double-knit with a matte hand.",
    care: "Cold wash with like colours. Hang dry. No fabric softener — it coats the fibre and kills the recovery.",
    modelNote: "Model is 5'9\" / 175cm, wears size S.",
    rating: 4.9,
    reviewCount: 1247,
    reviews: reviewsFor("leggings", "axis-sculpt-legging"),
    related: ["meridian-bra", "shift-crop", "carbon-crew-sock"],
    tone: "apparel",
  },
  {
    slug: "meridian-bra",
    name: "Meridian High-Support Bra",
    tagline: "High impact that still lets you take a full breath.",
    world: "women",
    gender: "women",
    category: "Sports Bras",
    price: 46000,
    flat: "bra",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "bone", inStock: ["S", "M", "L"], low: ["L"] },
      { colorway: "emerald", inStock: ["XS", "S", "M", "L", "XL"], low: ["XS"] },
    ],
    activities: ["running", "training", "lifting"],
    fit: "compression",
    badges: ["Best Seller"],
    story:
      "High-support bras usually solve movement by removing room to breathe. We treated support and respiration as two separate problems. The underband is wide and load-spreading; the cup is encapsulated rather than compressed; the rib panel is a different, more elastic knit than the rest of the garment. You get lockdown at the chest and expansion at the ribs.",
    benefits: [
      { title: "Encapsulated, not flattened", detail: "Separate moulded cups hold shape through impact instead of compressing everything to the chest wall." },
      { title: "Breathing rib panel", detail: "A more elastic knit across the lower rib lets the diaphragm expand fully under load." },
      { title: "Load-spreading band", detail: "A 5cm underband distributes pressure rather than concentrating it into a line." },
      { title: "Fixed straps", detail: "Anchored at the shoulder blade so nothing slides during overhead work." },
    ],
    fabric: "76% recycled polyamide, 24% elastane. Moulded cup, bonded band.",
    care: "Cold hand wash. Reshape cups and dry flat. Never tumble dry.",
    modelNote: "Model is 5'7\" / 170cm, wears size M.",
    rating: 4.9,
    reviewCount: 892,
    reviews: reviewsFor("bra", "meridian-bra"),
    related: ["axis-sculpt-legging", "shift-crop", "vector-training-short"],
    tone: "apparel",
  },
  {
    slug: "shift-crop",
    name: "Shift Training Crop",
    tagline: "A layer light enough to forget you put it on.",
    world: "women",
    gender: "women",
    category: "Tops",
    price: 34000,
    flat: "crop",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "bone", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: ["XS"] },
      { colorway: "sand", inStock: ["S", "M", "L"], low: ["S"] },
    ],
    activities: ["training", "yoga", "everyday"],
    fit: "relaxed",
    isNew: true,
    story:
      "A crop cut for movement rather than for the mirror. The body is a loose, air-permeable jersey; the shoulder is dropped just enough to clear the deltoid on overhead work; the hem sits at the natural waist and stays there. It layers over the Meridian without bunching.",
    benefits: [
      { title: "Air-permeable jersey", detail: "An open knit that moves heat out instead of trapping it against the skin." },
      { title: "Cleared shoulder", detail: "The seam drops off the deltoid so pressing overhead never binds." },
      { title: "Anchored hem", detail: "A weighted hem finish keeps the crop where you set it." },
    ],
    fabric: "58% Tencel lyocell, 42% recycled polyester. 140gsm open jersey.",
    care: "Cold machine wash. Hang dry.",
    modelNote: "Model is 5'8\" / 173cm, wears size S.",
    rating: 4.8,
    reviewCount: 431,
    reviews: reviewsFor("top", "shift-crop"),
    related: ["axis-sculpt-legging", "meridian-bra", "thermal-shell-jacket"],
    tone: "apparel",
  },
  {
    slug: "vector-training-short",
    name: "Vector Training Short",
    tagline: "Squat-proof, chafe-free, pocket-honest.",
    world: "women",
    gender: "women",
    category: "Shorts",
    price: 38000,
    flat: "shorts",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "storm", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "oxide", inStock: ["S", "M", "L"], low: ["S", "M", "L"] },
    ],
    activities: ["lifting", "training", "running"],
    fit: "sculpt",
    story:
      "A 13cm inseam that does not ride, in the same 280gsm knit as the Axis. Two things most training shorts get wrong: the leg opening is cut straight, which makes it climb, and the pocket is sewn into the waistband, which makes it swing. We cut the opening on a curve and dropped the pocket into the thigh panel.",
    benefits: [
      { title: "Curved leg opening", detail: "Cut on the diagonal so the hem tracks the thigh instead of climbing it." },
      { title: "Thigh-panel pocket", detail: "A phone sits flat against the leg with no swing at speed." },
      { title: "Opacity guaranteed", detail: "Squat-tested at depth under direct light, every colourway." },
    ],
    fabric: "72% recycled polyamide, 28% elastane. 280gsm double-knit.",
    care: "Cold wash. Hang dry. No softener.",
    modelNote: "Model is 5'6\" / 168cm, wears size S. 13cm inseam.",
    rating: 4.8,
    reviewCount: 318,
    reviews: reviewsFor("shorts", "vector-training-short"),
    related: ["meridian-bra", "axis-sculpt-legging", "carbon-crew-sock"],
    tone: "apparel",
  },

  /* ================= MEN ================= */
  {
    slug: "forge-training-tee",
    name: "Forge Training Tee",
    tagline: "Cut on the deltoid. Doesn't cling when it matters.",
    world: "men",
    gender: "men",
    category: "Tops",
    price: 32000,
    flat: "tee",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "graphite", inStock: ["S", "M", "L", "XL", "XXL"], low: ["S"] },
      { colorway: "bone", inStock: ["M", "L", "XL"], low: ["M"] },
      { colorway: "emerald", inStock: ["M", "L", "XL"], low: ["M", "XL"] },
    ],
    activities: ["lifting", "training", "everyday"],
    fit: "regular",
    badges: ["Best Seller"],
    story:
      "The problem with training tees is that they become transparent and adhesive at exactly the moment you would rather they did not. We solved it with fibre geometry instead of a coating: a slubbed yarn that lifts the fabric off the skin at micro-scale, so sweat wicks through the gaps rather than pinning the cloth to your back.",
    benefits: [
      { title: "Lifted weave", detail: "A slubbed yarn holds the cloth off the skin, so soaked fabric still releases." },
      { title: "Deltoid seam", detail: "The shoulder seam lands on the muscle, not past it — nothing binds on a press." },
      { title: "Held hem", detail: "A double-needle hem that does not creep up during cleans or pull-ups." },
      { title: "Colour-fast", detail: "Solution-dyed, so the blacks stay black through a hundred washes." },
    ],
    fabric: "60% combed cotton, 40% recycled polyester. 180gsm slub jersey.",
    care: "Cold machine wash. Tumble dry low.",
    modelNote: "Model is 6'1\" / 185cm, wears size L.",
    rating: 4.9,
    reviewCount: 2104,
    reviews: reviewsFor("top", "forge-training-tee"),
    related: ["anvil-compression-top", "grind-training-short", "thermal-shell-jacket"],
    tone: "apparel",
  },
  {
    slug: "anvil-compression-top",
    name: "Anvil Compression Top",
    tagline: "Graduated pressure where the work happens.",
    world: "men",
    gender: "men",
    category: "Compression",
    price: 44000,
    flat: "compressionTop",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: ["XXL"] },
      { colorway: "slate", inStock: ["M", "L", "XL"], low: [] },
      { colorway: "emerald", inStock: ["M", "L"], low: ["M", "L"] },
    ],
    activities: ["lifting", "training", "recovery"],
    fit: "compression",
    story:
      "Compression is only useful if it is graduated. Uniform pressure is just a tight shirt. The Anvil is knitted at four distinct tensions — highest through the lower back and obliques, lowest across the chest — so it supports the trunk under load without restricting the ribcage.",
    benefits: [
      { title: "Four-zone knit", detail: "Pressure mapped to the trunk: highest at the lower back, lowest at the chest." },
      { title: "Trunk support", detail: "Proprioceptive feedback through the midsection on heavy compound work." },
      { title: "Layers flat", detail: "Bonded seams sit flush under a tee or a shell with no ridge." },
    ],
    fabric: "80% recycled polyamide, 20% elastane. Zone-knitted, bonded seams.",
    care: "Cold wash. Hang dry. No softener.",
    modelNote: "Model is 6'0\" / 183cm, wears size M.",
    rating: 4.8,
    reviewCount: 654,
    reviews: reviewsFor("top", "anvil-compression-top"),
    related: ["forge-training-tee", "grind-training-short", "carbon-crew-sock"],
    tone: "train",
  },
  {
    slug: "grind-training-short",
    name: "Grind Training Short",
    tagline: "The liner is the product. Everything else is the shell.",
    world: "men",
    gender: "men",
    category: "Shorts",
    price: 40000,
    flat: "shorts",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "storm", inStock: ["S", "M", "L", "XL"], low: ["S"] },
      { colorway: "clay", inStock: ["M", "L", "XL"], low: ["XL"] },
    ],
    activities: ["running", "training", "lifting"],
    fit: "regular",
    story:
      "Most training shorts treat the liner as an afterthought. We built the short around it: a seamless compression liner with a flat gusset and zero inner-thigh seam, which is where every chafe problem originates. The 18cm shell is a separate, near-weightless woven that moves independently.",
    benefits: [
      { title: "Seamless liner", detail: "A flat gusset with no inner-thigh seam. The chafe problem, removed at source." },
      { title: "Independent shell", detail: "An 18cm woven that moves separately from the liner rather than dragging on it." },
      { title: "Zip security pocket", detail: "A back zip pocket that holds a phone without bounce." },
    ],
    fabric: "Shell: 100% recycled polyester ripstop, 92gsm. Liner: 82% polyamide, 18% elastane.",
    care: "Cold machine wash. Hang dry.",
    modelNote: "Model is 5'11\" / 180cm, wears size M. 18cm inseam.",
    rating: 4.9,
    reviewCount: 1076,
    reviews: reviewsFor("shorts", "grind-training-short"),
    related: ["forge-training-tee", "anvil-compression-top", "carbon-crew-sock"],
    tone: "apparel",
  },
  {
    slug: "thermal-shell-jacket",
    name: "Thermal Shell Jacket",
    tagline: "A warm-up layer that holds its shape off the floor.",
    world: "men",
    gender: "unisex",
    category: "Outerwear",
    price: 96000,
    compareAt: 118000,
    flat: "jacket",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL"], low: ["S"] },
      { colorway: "graphite", inStock: ["M", "L", "XL", "XXL"], low: [] },
      { colorway: "sand", inStock: ["M", "L"], low: ["M", "L"] },
    ],
    activities: ["training", "everyday", "recovery"],
    fit: "regular",
    badges: ["Limited"],
    story:
      "A shell built for the twenty minutes either side of a session — the walk in, the warm-up, the walk out — that does not look like gym kit when you keep it on afterwards. Matte double-weave with a bonded collar that stands rather than collapses, and enough structure through the shoulder to read as outerwear.",
    benefits: [
      { title: "Standing collar", detail: "A bonded three-layer collar that holds its line instead of folding flat." },
      { title: "Matte double-weave", detail: "No sheen, no rustle. Reads as outerwear in daylight." },
      { title: "Wind-resistant", detail: "A tight weave that blocks moving air without a membrane's clamminess." },
      { title: "Packs down", detail: "Compresses into its own left pocket at roughly the size of a water bottle." },
    ],
    fabric: "100% recycled polyester double-weave, 165gsm, DWR-finished.",
    care: "Cold wash separately. Tumble dry low to reactivate the finish.",
    modelNote: "Model is 6'1\" / 185cm, wears size L. Relaxed through the body.",
    rating: 4.9,
    reviewCount: 389,
    reviews: reviewsFor("outer", "thermal-shell-jacket"),
    related: ["forge-training-tee", "shift-crop", "field-hoodie"],
    tone: "void",
  },
  {
    slug: "field-hoodie",
    name: "Field Hoodie",
    tagline: "Heavyweight, unhurried, built to outlast the season.",
    world: "men",
    gender: "unisex",
    category: "Outerwear",
    price: 78000,
    flat: "hoodie",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "graphite", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "onyx", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "sand", inStock: ["M", "L", "XL"], low: ["M"] },
    ],
    activities: ["everyday", "recovery"],
    fit: "oversized",
    story:
      "460gsm loopback cotton, garment-dyed so the colour sits in the fibre rather than on it. Cut deliberately oversized through the body with a set-in shoulder, so it drapes rather than balloons. This is the layer you pull on after the work is done.",
    benefits: [
      { title: "460gsm loopback", detail: "Heavyweight cotton that softens with wear and holds structure through it." },
      { title: "Garment-dyed", detail: "Colour lives in the fibre. It fades the way good denim fades, not the way cheap fleece does." },
      { title: "Set-in shoulder", detail: "Oversized through the body without the dropped-shoulder slump." },
    ],
    fabric: "100% organic cotton loopback, 460gsm, garment-dyed.",
    care: "Cold wash inside out. Tumble dry low. Expect gentle fade.",
    modelNote: "Model is 6'0\" / 183cm, wears size L for an oversized fit.",
    rating: 4.9,
    reviewCount: 742,
    reviews: reviewsFor("outer", "field-hoodie"),
    related: ["thermal-shell-jacket", "forge-training-tee", "carbon-crew-sock"],
    tone: "void",
  },

  /* ================= ACCESSORIES ================= */
  {
    slug: "carbon-crew-sock",
    name: "Carbon Compression Crew",
    tagline: "Graduated pressure, ankle to calf.",
    world: "accessories",
    gender: "unisex",
    category: "Compression",
    price: 14000,
    flat: "socks",
    sizes: SOCK_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S/M", "L/XL"], low: [] },
      { colorway: "bone", inStock: ["S/M", "L/XL"], low: ["S/M"] },
      { colorway: "emerald", inStock: ["L/XL"], low: ["L/XL"] },
    ],
    activities: ["running", "recovery", "training"],
    fit: "compression",
    story:
      "20–30mmHg graduated compression, highest at the ankle and easing toward the calf, which is the direction venous return actually travels. Cushioned under the heel and forefoot, thin across the top so it fits inside a training shoe without crowding.",
    benefits: [
      { title: "True graduated pressure", detail: "20–30mmHg, strongest at the ankle, easing up the calf — the direction return flow travels." },
      { title: "Zoned cushioning", detail: "Padded at heel and forefoot, thin across the instep so shoes still fit." },
      { title: "Held arch", detail: "A knitted arch band that stops the sock migrating inside the shoe." },
    ],
    fabric: "68% polyamide, 22% cotton, 10% elastane. Seamless toe.",
    care: "Cold machine wash. Hang dry.",
    modelNote: "S/M fits UK 4–8. L/XL fits UK 8–12.",
    rating: 4.8,
    reviewCount: 967,
    reviews: reviewsFor("access", "carbon-crew-sock"),
    related: ["grind-training-short", "haul-training-bag", "recovery-roller"],
    tone: "apparel",
  },
  {
    slug: "haul-training-bag",
    name: "Haul Training Bag",
    tagline: "32 litres, one wet compartment, no wasted volume.",
    world: "accessories",
    gender: "unisex",
    category: "Bags",
    price: 88000,
    flat: "bag",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["One Size"], low: [] },
      { colorway: "graphite", inStock: ["One Size"], low: ["One Size"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    badges: ["Signature"],
    story:
      "Designed around what a session actually contains: shoes, a wet kit, a shaker, a laptop, and the things you refuse to leave in a locker. Each of those gets its own volume, so nothing contaminates anything else and nothing rattles loose.",
    benefits: [
      { title: "Sealed wet compartment", detail: "A welded 6L pocket that isolates a soaked kit from everything else." },
      { title: "Ventilated shoe base", detail: "A separate base compartment with airflow ports." },
      { title: "Padded 15\" laptop sleeve", detail: "Suspended off the base so a dropped bag doesn't reach the device." },
      { title: "Load-spread strap", detail: "A wide, floating shoulder pad that stays put on a walk or a ride." },
    ],
    fabric: "900D recycled ripstop with a TPU-welded base. YKK AquaGuard hardware.",
    care: "Wipe clean. Do not machine wash.",
    modelNote: "32L. 52 × 28 × 26cm. 940g empty.",
    rating: 4.9,
    reviewCount: 512,
    reviews: reviewsFor("access", "haul-training-bag"),
    related: ["carbon-crew-sock", "recovery-roller", "field-hoodie"],
    tone: "void",
  },
  {
    slug: "signal-cap",
    name: "Signal Training Cap",
    tagline: "Structured six-panel that survives the wash.",
    world: "accessories",
    gender: "unisex",
    category: "Headwear",
    price: 22000,
    flat: "cap",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["One Size"], low: [] },
      { colorway: "bone", inStock: ["One Size"], low: [] },
      { colorway: "emerald", inStock: ["One Size"], low: ["One Size"] },
    ],
    activities: ["running", "training", "everyday"],
    fit: "regular",
    isNew: true,
    story:
      "A six-panel with a laminated front stiffener rather than a fused one, so it keeps its shape after being soaked and dried more times than a cap should reasonably survive. Sweatband is a moisture-moving knit, not a strip of foam.",
    benefits: [
      { title: "Laminated stiffener", detail: "Keeps its structure after repeated soak-and-dry cycles." },
      { title: "Moving sweatband", detail: "A wicking knit band rather than foam that saturates and stays wet." },
      { title: "Reflective rear tab", detail: "A small retroreflective detail for low-light running." },
    ],
    fabric: "100% recycled polyester twill. Laminated front panel.",
    care: "Hand wash cold. Air dry on a form.",
    modelNote: "One size. Adjustable 54–61cm.",
    rating: 4.7,
    reviewCount: 233,
    reviews: reviewsFor("access", "signal-cap"),
    related: ["haul-training-bag", "carbon-crew-sock", "forge-training-tee"],
    tone: "apparel",
  },
  {
    slug: "recovery-roller",
    name: "Density Recovery Roller",
    tagline: "Two densities in one cylinder.",
    world: "accessories",
    gender: "unisex",
    category: "Recovery",
    price: 32000,
    flat: "roller",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["One Size"], low: [] },
      { colorway: "emerald", inStock: ["One Size"], low: ["One Size"] },
    ],
    activities: ["recovery"],
    fit: "regular",
    story:
      "A firm EVA core wrapped in a softer outer, with the surface split into two zones along its length: a flat zone for broad surfaces like quads and lats, and a ridged zone for working into a specific point. One tool instead of three.",
    benefits: [
      { title: "Dual-zone surface", detail: "Flat for broad tissue, ridged for targeted work. One tool, two jobs." },
      { title: "Firm EVA core", detail: "Holds pressure under bodyweight instead of collapsing." },
      { title: "Travel length", detail: "33cm — long enough to work across the back, short enough to pack." },
    ],
    fabric: "High-density EVA core, moulded outer. 33 × 14cm, 620g.",
    care: "Wipe clean with a damp cloth.",
    modelNote: "33 × 14cm. Supports up to 150kg.",
    rating: 4.8,
    reviewCount: 401,
    reviews: reviewsFor("access", "recovery-roller"),
    related: ["carbon-crew-sock", "recover-magnesium", "haul-training-bag"],
    tone: "recover",
  },

  /* ================= PERFORMANCE / NUTRITION ================= */
  {
    slug: "base-whey-isolate",
    name: "Base Whey Isolate",
    tagline: "27g of protein. Nine ingredients. Every dose declared.",
    world: "performance",
    gender: "unisex",
    category: "Protein",
    price: 52000,
    flat: "tub",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "bone", inStock: ["One Size"], low: [] },
      { colorway: "onyx", inStock: ["One Size"], low: [] },
    ],
    activities: ["lifting", "training", "recovery"],
    fit: "regular",
    badges: ["Best Seller"],
    story:
      "Cross-flow microfiltered whey isolate at 90% protein by dry weight, with nothing in the tub that is not doing a job. No proprietary blend, no amino spiking, no filler bulking the scoop. The label is the whole formulation because there is nothing to hide behind.",
    benefits: [
      { title: "27g per serving", detail: "Cross-flow microfiltered isolate at 90% protein by dry weight." },
      { title: "Full disclosure label", detail: "Every ingredient at its exact dose. No proprietary blends." },
      { title: "Under 1g lactose", detail: "Filtered low enough for most people who react to whey concentrate." },
      { title: "Third-party tested", detail: "Every batch tested for identity, heavy metals and banned substances." },
    ],
    fabric: "900g tub. 30 servings at 30g.",
    care: "Store sealed below 25°C. Use within 90 days of opening.",
    modelNote: "30 servings per tub.",
    rating: 4.9,
    reviewCount: 1583,
    reviews: reviewsFor("fuel", "base-whey-isolate"),
    related: ["drive-pre-training", "recover-magnesium", "daily-foundation"],
    tone: "fuel",
    nutrition: {
      what: "A fast-absorbing protein isolate that supplies the amino acids muscle repair draws on after training.",
      when: "Within roughly two hours of a session, or any time daily protein is falling short.",
      who: "Anyone training with intent who is not consistently hitting 1.6–2.2g of protein per kg of bodyweight from food alone.",
      why: "Total daily protein is the single most evidence-supported nutritional lever for retaining and building lean mass. Powder is not magic — it is a convenient way to close a gap that food did not close.",
      servings: 30,
      subscribeDiscount: 15,
      ingredients: [
        { name: "Whey protein isolate", amount: "30g", note: "Cross-flow microfiltered. 27g protein." },
        { name: "L-leucine", amount: "1.5g", note: "The amino acid that initiates muscle protein synthesis." },
        { name: "Digestive enzyme blend", amount: "150mg", note: "Protease and lactase, for tolerance." },
        { name: "Natural flavour", amount: "—", note: "No artificial colour." },
        { name: "Sunflower lecithin", amount: "500mg", note: "For mixing. Replaces soy lecithin." },
      ],
    },
  },
  {
    slug: "drive-pre-training",
    name: "Drive Pre-Training",
    tagline: "Clinically dosed. No stimulant theatre.",
    world: "performance",
    gender: "unisex",
    category: "Performance",
    price: 44000,
    flat: "sachet",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "emerald", inStock: ["One Size"], low: [] },
      { colorway: "onyx", inStock: ["One Size"], low: ["One Size"] },
    ],
    activities: ["lifting", "training", "running"],
    fit: "regular",
    story:
      "Most pre-workouts are caffeine plus enough beta-alanine to make you tingle, so it feels like it is working. Drive is dosed at the amounts the research actually used — which means fewer ingredients, at higher doses, and a formula you can read.",
    benefits: [
      { title: "Research-matched doses", detail: "Every active at the amount used in the studies it cites, not a token sprinkle." },
      { title: "200mg caffeine", detail: "A real but controlled dose, paired with L-theanine to blunt the edge." },
      { title: "No tingle theatre", detail: "Beta-alanine at a functional dose, not a sensory gimmick." },
      { title: "Third-party tested", detail: "Batch-tested for banned substances." },
    ],
    fabric: "20 sachets, 12g each.",
    care: "Store below 25°C, away from direct light.",
    modelNote: "20 servings per box.",
    rating: 4.8,
    reviewCount: 874,
    reviews: reviewsFor("fuel", "drive-pre-training"),
    related: ["base-whey-isolate", "daily-foundation", "recover-magnesium"],
    tone: "fuel",
    nutrition: {
      what: "A pre-training formula built around caffeine, citrulline and creatine at doses matched to the published research.",
      when: "25–30 minutes before training. Not within six hours of sleep.",
      who: "People training hard enough that acute performance actually matters. Not a substitute for sleep.",
      why: "Caffeine and citrulline have consistent acute effects on output and perceived effort. Most products under-dose both to keep costs down and hide it behind a blend.",
      servings: 20,
      subscribeDiscount: 15,
      ingredients: [
        { name: "L-citrulline", amount: "6g", note: "Nitric oxide precursor. Blood flow and volume." },
        { name: "Creatine monohydrate", amount: "3g", note: "The most studied performance supplement there is." },
        { name: "Beta-alanine", amount: "3.2g", note: "Buffers acid accumulation in longer sets." },
        { name: "Caffeine anhydrous", amount: "200mg", note: "Output and perceived effort." },
        { name: "L-theanine", amount: "200mg", note: "Takes the jitter off the caffeine." },
        { name: "Sodium", amount: "300mg", note: "Replaces what sweat removes." },
      ],
    },
  },
  {
    slug: "recover-magnesium",
    name: "Recover Night Formula",
    tagline: "For the third of training that happens asleep.",
    world: "performance",
    gender: "unisex",
    category: "Recovery",
    price: 38000,
    flat: "sachet",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "slate", inStock: ["One Size"], low: [] },
      { colorway: "onyx", inStock: ["One Size"], low: [] },
    ],
    activities: ["recovery"],
    fit: "regular",
    story:
      "Adaptation happens during sleep, not during the session. Recover is a magnesium glycinate base with glycine and tart cherry — three things with reasonable evidence behind sleep quality and next-day soreness, and nothing sedating.",
    benefits: [
      { title: "Magnesium glycinate", detail: "The bioavailable form, without the gastric effects of oxide or citrate." },
      { title: "Not a sedative", detail: "Supports sleep quality without the next-morning fog of a sleep aid." },
      { title: "Tart cherry", detail: "Studied for next-day soreness after hard eccentric work." },
    ],
    fabric: "30 sachets, 8g each.",
    care: "Store below 25°C.",
    modelNote: "30 servings per box.",
    rating: 4.8,
    reviewCount: 596,
    reviews: reviewsFor("fuel", "recover-magnesium"),
    related: ["recovery-roller", "base-whey-isolate", "daily-foundation"],
    tone: "recover",
    nutrition: {
      what: "A night formula built around magnesium glycinate, glycine and tart cherry to support sleep quality and next-day recovery.",
      when: "30–45 minutes before bed, on training days and rest days alike.",
      who: "Anyone training hard whose sleep is the weak link — which is most people who train hard.",
      why: "Hard training raises magnesium demand, and inadequate sleep blunts the adaptation the training was for. This addresses the recovery half of the equation, which most supplement ranges ignore entirely.",
      servings: 30,
      subscribeDiscount: 15,
      ingredients: [
        { name: "Magnesium glycinate", amount: "400mg", note: "Elemental magnesium, bioavailable form." },
        { name: "Glycine", amount: "3g", note: "Studied for sleep onset and core temperature." },
        { name: "Tart cherry extract", amount: "480mg", note: "Standardised. Next-day soreness." },
        { name: "Zinc bisglycinate", amount: "15mg", note: "Recovery and immune function." },
      ],
    },
  },
  {
    slug: "daily-foundation",
    name: "Daily Foundation",
    tagline: "The unglamorous things, at doses that count.",
    world: "performance",
    gender: "unisex",
    category: "Daily Essentials",
    price: 34000,
    flat: "shaker",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "bone", inStock: ["One Size"], low: [] },
      { colorway: "graphite", inStock: ["One Size"], low: [] },
    ],
    activities: ["everyday", "training", "recovery"],
    fit: "regular",
    story:
      "Not a multivitamin with sixty ingredients at 2% of what matters. Four things that people who train are genuinely, measurably often short of — vitamin D, omega-3, creatine and electrolytes — at doses that do something.",
    benefits: [
      { title: "Four actives, real doses", detail: "Not a sixty-ingredient label at trace amounts." },
      { title: "5g creatine", detail: "The full daily maintenance dose, not a token gram." },
      { title: "Third-party tested", detail: "Batch-tested for identity and contaminants." },
    ],
    fabric: "30 daily sachets.",
    care: "Store below 25°C.",
    modelNote: "30 servings per box.",
    rating: 4.7,
    reviewCount: 447,
    reviews: reviewsFor("fuel", "daily-foundation"),
    related: ["base-whey-isolate", "drive-pre-training", "recover-magnesium"],
    tone: "fuel",
    nutrition: {
      what: "A daily base covering the four deficiencies most common in people who train seriously.",
      when: "Once daily with a meal containing fat, for the D3 and omega-3.",
      who: "Anyone training consistently who would rather cover the basics properly than take twelve separate products.",
      why: "Insufficiency in vitamin D and omega-3 is common and measurable, and both affect recovery and mood. Creatine and sodium are the two most reliably useful additions for anyone under training load.",
      servings: 30,
      subscribeDiscount: 15,
      ingredients: [
        { name: "Creatine monohydrate", amount: "5g", note: "Full maintenance dose." },
        { name: "Vitamin D3", amount: "2000 IU", note: "With K2 for direction of use." },
        { name: "Omega-3 (EPA/DHA)", amount: "1200mg", note: "Algal source. Third-party tested for oxidation." },
        { name: "Electrolyte blend", amount: "1.1g", note: "Sodium, potassium, magnesium." },
      ],
    },
  },
];

/* ==================================================================
   BUNDLES — curated performance systems, not random packages
   ================================================================== */

export const BUNDLES: Bundle[] = [
  {
    slug: "the-starter",
    name: "The Starter",
    tier: "Entry",
    promise: "Everything you need on day one. Nothing you don't.",
    description:
      "The three pieces that make the first eight weeks feel deliberate rather than improvised: one thing to train in, one thing to carry it in, and one thing that helps you recover from it.",
    items: ["forge-training-tee", "grind-training-short", "carbon-crew-sock"],
    price: 74000,
    saves: 12000,
    tone: "apparel",
  },
  {
    slug: "the-performance",
    name: "The Performance",
    tier: "Core",
    promise: "The kit for people already doing the work.",
    description:
      "Compression where it earns its place, apparel that survives five sessions a week, and the one supplement with the strongest evidence behind it. This is the bundle most members settle on.",
    items: ["anvil-compression-top", "grind-training-short", "carbon-crew-sock", "base-whey-isolate"],
    extras: ["3 months of CHISSELED Training, included"],
    price: 138000,
    saves: 28000,
    tone: "train",
  },
  {
    slug: "the-complete-chisseled",
    name: "The Complete Chisseled",
    tier: "Complete",
    promise: "Apparel, training, nutrition and recovery as one system.",
    description:
      "The full method in a single box. Everything is chosen to work with everything else — the compression layers under the tee, the recovery formula pairs with the roller, and the training membership sequences all of it into a twelve-week block.",
    items: [
      "forge-training-tee",
      "anvil-compression-top",
      "grind-training-short",
      "haul-training-bag",
      "base-whey-isolate",
      "recover-magnesium",
      "recovery-roller",
    ],
    extras: ["12 months of CHISSELED Training", "One coaching consultation", "Member-only drop access"],
    price: 298000,
    saves: 86000,
    tone: "void",
  },
  {
    slug: "the-womens-performance",
    name: "The Women's Performance",
    tier: "Core",
    promise: "The full women's system, sized and seamed as one.",
    description:
      "The Axis, the Meridian and the Shift are designed on the same block, so the seams line up and nothing bunches where two layers meet. Paired with the supplement that closes the most common gap.",
    items: ["axis-sculpt-legging", "meridian-bra", "shift-crop", "base-whey-isolate"],
    extras: ["3 months of CHISSELED Training, included"],
    price: 168000,
    saves: 32000,
    tone: "apparel",
  },
];

/* ==================================================================
   TRAINING PROGRAMS
   ================================================================== */

export const PROGRAMS: Program[] = [
  {
    slug: "foundation-12",
    name: "Foundation 12",
    discipline: "Strength",
    weeks: 12,
    daysPerWeek: 4,
    level: "Foundation",
    focus: "Build the base. Learn the lifts. Earn the right to go heavy.",
    summary:
      "Twelve weeks that assume nothing. Every session teaches a pattern before it loads it, and the progression is slow enough that week twelve is genuinely stronger than week one rather than just more tired.",
    blocks: [
      { name: "Pattern", weeks: "1–4", intent: "Movement quality under light load. Positions before numbers." },
      { name: "Accumulate", weeks: "5–9", intent: "Volume climbs while intensity stays moderate. This is where the base is built." },
      { name: "Express", weeks: "10–12", intent: "Volume drops, intensity rises. You find out what the base was worth." },
    ],
    equipment: "Barbell, rack, dumbbells, bench.",
    coach: "Coach Dami Adeyemi",
    tone: "train",
    members: 12480,
  },
  {
    slug: "hypertrophy-block",
    name: "Hypertrophy Block",
    discipline: "Physique",
    weeks: 10,
    daysPerWeek: 5,
    level: "Intermediate",
    focus: "Volume, proximity to failure, and enough recovery to keep coming back.",
    summary:
      "A five-day upper/lower split with autoregulated volume. You log reps in reserve, the program reads them, and the next week's volume moves accordingly rather than following a fixed spreadsheet.",
    blocks: [
      { name: "Ramp", weeks: "1–3", intent: "Establish working weights and baseline RIR." },
      { name: "Overreach", weeks: "4–8", intent: "Volume climbs to the edge of what you can recover from." },
      { name: "Deload & Test", weeks: "9–10", intent: "Cut volume hard. Let the adaptation surface." },
    ],
    equipment: "Full gym access.",
    coach: "Coach Tobi Okonkwo",
    tone: "train",
    members: 18902,
  },
  {
    slug: "engine-8",
    name: "Engine 8",
    discipline: "Conditioning",
    weeks: 8,
    daysPerWeek: 4,
    level: "Intermediate",
    focus: "Aerobic base first. Intensity second. In that order.",
    summary:
      "Most conditioning programs are eight weeks of being smashed. This is six weeks of building an aerobic base you did not have, and two weeks of using it. The difference shows up around week nine.",
    blocks: [
      { name: "Base", weeks: "1–5", intent: "Zone 2 volume. Unglamorous, and the entire point." },
      { name: "Threshold", weeks: "6–7", intent: "Sustained hard efforts at the edge of steady state." },
      { name: "Sharpen", weeks: "8", intent: "Short maximal intervals on a finished base." },
    ],
    equipment: "Rower or bike, open ground.",
    coach: "Coach Amina Bello",
    tone: "recover",
    members: 9140,
  },
  {
    slug: "reset-4",
    name: "Reset 4",
    discipline: "Mobility & Recovery",
    weeks: 4,
    daysPerWeek: 6,
    level: "Foundation",
    focus: "Restore range. Reduce load. Come back able to train again.",
    summary:
      "Four weeks of short daily sessions built to be done after work with no equipment and no motivation required. Designed for the point in a training year where something has started to hurt.",
    blocks: [
      { name: "Offload", weeks: "1–2", intent: "Reduce systemic load. Restore hip and thoracic range." },
      { name: "Rebuild", weeks: "3–4", intent: "Reintroduce load into the range you just recovered." },
    ],
    equipment: "A roller and a floor.",
    coach: "Coach Amina Bello",
    tone: "recover",
    members: 6218,
  },
  {
    slug: "peak-16",
    name: "Peak 16",
    discipline: "Strength",
    weeks: 16,
    daysPerWeek: 4,
    level: "Advanced",
    focus: "One number, sixteen weeks, no wasted sessions.",
    summary:
      "A peaking block for people who already have a base and a target. Every session is accounted for against a single testing day at week sixteen. It is not flexible, and that is the point.",
    blocks: [
      { name: "Volume", weeks: "1–6", intent: "The largest workload of the block. Hard, submaximal, repeatable." },
      { name: "Intensity", weeks: "7–12", intent: "Load climbs, volume falls, specificity rises." },
      { name: "Realise", weeks: "13–16", intent: "Taper, open, and test." },
    ],
    equipment: "Full barbell setup, competition plates preferred.",
    coach: "Coach Dami Adeyemi",
    tone: "void",
    members: 4870,
  },
  {
    slug: "everyday-strong",
    name: "Everyday Strong",
    discipline: "General",
    weeks: 8,
    daysPerWeek: 3,
    level: "Foundation",
    focus: "Three sessions a week that fit a real life.",
    summary:
      "Forty-five minutes, three times a week, designed around the constraint that actually stops most people: time. Full-body sessions with no redundancy, built so that missing one week does not break the block.",
    blocks: [
      { name: "Establish", weeks: "1–3", intent: "Find working loads across six core patterns." },
      { name: "Progress", weeks: "4–8", intent: "Linear progression with a built-in catch for missed weeks." },
    ],
    equipment: "Dumbbells and a bench.",
    coach: "Coach Tobi Okonkwo",
    tone: "apparel",
    members: 21340,
  },
];

/* ==================================================================
   ATHLETES
   ================================================================== */

export const ATHLETES: Athlete[] = [
  {
    slug: "dami-adeyemi",
    name: "Dami Adeyemi",
    role: "Head Coach, Strength",
    discipline: "Powerlifting",
    location: "Lagos, NG",
    quote: "The programme is not the hard part. Showing up on the days you do not want to is the whole sport.",
    story:
      "Fifteen years under a bar, eight of them coaching other people to get under it properly. Dami wrote Foundation 12 after watching too many beginners run advanced programmes and quit inside a month. His argument is that the first year should be boring, and that people who accept this end up stronger by year three than people who do not.",
    stats: [
      { label: "Coaching", value: "8 yrs" },
      { label: "Athletes coached", value: "340+" },
      { label: "Programmes authored", value: "2" },
    ],
    tone: "train",
    pose: "front",
  },
  {
    slug: "amina-bello",
    name: "Amina Bello",
    role: "Coach, Conditioning & Recovery",
    discipline: "Endurance",
    location: "Abuja, NG",
    quote: "Everyone wants the intervals. Almost nobody wants the base that makes the intervals work.",
    story:
      "A former 1500m runner who moved into coaching after an injury that took eighteen months to resolve properly. That experience shapes everything she writes — Reset 4 exists because she needed it and nothing like it existed. She is the person on the team most likely to tell an athlete to do less.",
    stats: [
      { label: "Coaching", value: "6 yrs" },
      { label: "Marathon PB", value: "2:48" },
      { label: "Programmes authored", value: "2" },
    ],
    tone: "recover",
    pose: "back",
  },
  {
    slug: "tobi-okonkwo",
    name: "Tobi Okonkwo",
    role: "Coach, Physique",
    discipline: "Bodybuilding",
    location: "Port Harcourt, NG",
    quote: "Autoregulation is not a fancy word for going easy. It is a fancy word for being honest.",
    story:
      "Tobi built the autoregulated volume model behind Hypertrophy Block after years of watching fixed spreadsheets fail the moment life interfered. His programmes read your logged effort and adapt, which means a bad week costs you a week instead of a block.",
    stats: [
      { label: "Coaching", value: "9 yrs" },
      { label: "Athletes coached", value: "510+" },
      { label: "Programmes authored", value: "2" },
    ],
    tone: "apparel",
    pose: "front",
  },
  {
    slug: "chidera-nwosu",
    name: "Chidera Nwosu",
    role: "CHISSELED Athlete",
    discipline: "Olympic Weightlifting",
    location: "Enugu, NG",
    quote: "I did not get strong because I was talented. I got strong because I did not stop.",
    story:
      "Chidera started training at twenty-six with no athletic background, in a gym with one usable barbell. Four years later she competes nationally. She is on this page not because of the numbers but because her progression is the ordinary kind — slow, consistent, and available to anyone willing to do it.",
    stats: [
      { label: "Training", value: "4 yrs" },
      { label: "Clean & jerk", value: "88kg" },
      { label: "Bodyweight", value: "63kg" },
    ],
    tone: "train",
    pose: "front",
  },
];

/* ==================================================================
   JOURNAL
   ================================================================== */

export const ARTICLES: Article[] = [
  {
    slug: "the-case-for-boring-training",
    title: "The Case for Boring Training",
    category: "Training",
    excerpt:
      "The programmes that work are almost never the programmes that look interesting. Here is why the boring one wins, and what that means for how you should spend your first two years.",
    readMinutes: 7,
    date: "2026-08-12",
    author: "Dami Adeyemi",
    tone: "train",
    body: [
      "There is a particular kind of training programme that circulates well. It has variety. It has a name. It promises that this specific arrangement of exercises is the thing that has been missing. It is extremely good at being shared and extremely bad at making people stronger.",
      "The programmes that actually work share a quality that makes them almost unshareable: they repeat. The same lifts, the same patterns, week after week, with the load creeping up by increments small enough to be unsatisfying. Nobody screenshots that.",
      "The mechanism is not mysterious. Strength is a skill expressed under load, and skills consolidate through repetition. Every time you swap an exercise, you reset part of the learning curve. Do that often enough and you spend your entire training life on the steep, inefficient part of every curve and never reach the part where the strength actually accrues.",
      "This has a practical consequence for how you should think about your first two years. The goal is not to find the optimal programme. The goal is to find an adequate programme you will still be running in eighteen months. Adequacy sustained beats optimality abandoned, and it is not close.",
      "The corollary is that variety has a place — it just is not where people put it. Vary the accessory work, the conditioning, the way you warm up. Keep the main lifts fixed. That gives you enough novelty to stay engaged and enough repetition to actually adapt.",
      "If your programme is boring and your numbers are moving, the programme is working. Resist the urge to fix it.",
    ],
  },
  {
    slug: "protein-what-actually-matters",
    title: "Protein: What Actually Matters",
    category: "Nutrition",
    excerpt:
      "Timing windows, absorption limits, complete versus incomplete. Most of the protein conversation is noise around one number that does almost all of the work.",
    readMinutes: 6,
    date: "2026-07-28",
    author: "CHISSELED Nutrition",
    tone: "fuel",
    body: [
      "The protein conversation has an unusual amount of detail attached to a fairly simple underlying picture. There is a great deal of discussion about anabolic windows, per-meal absorption ceilings, and the precise superiority of one protein source over another. Most of it is real but small.",
      "The number that does the work is total daily intake. Somewhere between 1.6 and 2.2 grams per kilogram of bodyweight, distributed with reasonable evenness across the day, captures nearly all of the available benefit for nearly everyone training with intent.",
      "The thirty-minute post-training window turned out to be much wider than originally believed — closer to several hours, and largely irrelevant if you have eaten protein earlier in the day. Distribution matters somewhat: three or four meaningful protein feedings beat one enormous one. But this is a refinement, not a foundation.",
      "Source matters mostly through leucine content and digestibility. Animal sources hit the leucine threshold in smaller portions. Plant sources get there too, in larger portions or in combination. Neither fact should change what you eat if you are already hitting the daily number.",
      "Which brings us to the honest position on powder: it is food that is convenient. It does not do anything a chicken breast does not do. Its entire value is that it makes hitting the daily number easier on days when cooking is not going to happen. That is a real value, and it is the only one being claimed.",
      "If you are not consistently hitting the daily number, no amount of optimising the rest will matter. If you are, most of the remaining variables are worth a percent or two.",
    ],
  },
  {
    slug: "sleep-is-the-training-variable",
    title: "Sleep Is a Training Variable",
    category: "Recovery",
    excerpt:
      "You cannot programme around a sleep debt. Treating rest as the fourth training day changes what the other three are worth.",
    readMinutes: 5,
    date: "2026-07-15",
    author: "Amina Bello",
    tone: "recover",
    body: [
      "Athletes track load, volume, intensity and frequency with real precision, and then treat sleep as something that happens or does not. This is strange, because sleep is where the adaptation the training was supposed to produce actually occurs.",
      "Restricting sleep to five hours a night measurably reduces force output, increases perceived effort at a given load, and impairs the glucose handling that fuels the next session. None of this is subtle at the level of a training block. You do not lose a percent — you lose the session.",
      "The practical version: if you are choosing between a 5am session on five hours of sleep and a 6pm session on seven, take the evening. The session you can actually recover from is worth more than the session that fits your ideal schedule.",
      "This also reframes what a deload is for. A deload is not a reward for having trained hard. It is a period where reduced load allows accumulated fatigue to clear so that adaptation can surface. If your sleep has been poor for three weeks, you may need the deload sooner than the spreadsheet says.",
      "Track it the way you track your lifts. Seven hours is a training input. Treat a week of five-hour nights the way you would treat a week of missed sessions — because functionally, that is what it was.",
    ],
  },
  {
    slug: "why-compression-works-and-when-it-doesnt",
    title: "Why Compression Works, and When It Doesn't",
    category: "Performance",
    excerpt:
      "Graduated compression has a genuine mechanism and a narrow set of situations where it helps. Here is the honest boundary between the two.",
    readMinutes: 6,
    date: "2026-06-30",
    author: "CHISSELED Performance",
    tone: "apparel",
    body: [
      "Compression apparel sits in an awkward place: the marketing overclaims, which makes it easy to dismiss the parts that are actually supported.",
      "The supported part is graduated compression for venous return. Pressure that is highest at the ankle and decreases up the calf assists the direction blood is already travelling on its way back to the heart. This has reasonable evidence behind reduced post-exercise soreness and swelling, particularly after long-duration or high-eccentric work.",
      "The word doing the work is graduated. Uniform pressure — a garment that is simply tight everywhere — does not produce this effect. A great deal of what is sold as compression is just a snug fit, and the distinction is not visible from the product page.",
      "The overclaimed part is acute performance. Compression during a session does not reliably make you faster or stronger. What it does reliably do is change proprioceptive feedback, which some athletes find genuinely useful for trunk position under heavy load. That is a real benefit; it is just not the one on the packaging.",
      "The honest summary: buy graduated compression for recovery and for the days after hard work, where the evidence is decent. Buy compression tops for the trunk feedback if you like how it feels under load. Do not buy either expecting a performance gain during the session itself.",
    ],
  },
  {
    slug: "the-discipline-myth",
    title: "The Discipline Myth",
    category: "Mindset",
    excerpt:
      "People who train consistently are not exerting more willpower than you. They have arranged their lives so that less willpower is required.",
    readMinutes: 5,
    date: "2026-06-08",
    author: "Dami Adeyemi",
    tone: "void",
    body: [
      "The people who train consistently for years are usually described as disciplined, which implies they are winning a daily internal argument that the rest of us lose. In my experience coaching several hundred of them, this is almost exactly backwards.",
      "What they have done is remove the argument. The kit is packed the night before. The session is at the same time on the same days. The gym is on the route they already travel. The programme is decided, so there is no decision to make at the door. By the time willpower would be needed, there is nothing left for it to do.",
      "This matters because it is actionable in a way that being told to be more disciplined is not. You cannot decide to want it more. You can decide to move the gym bag to the door.",
      "The corollary is that consistency problems are usually design problems. If you keep missing Thursday sessions, the answer is rarely more resolve — it is that Thursday is badly placed and should move.",
      "Audit the friction. Every decision you remove from the path between waking up and starting the session is a decision that cannot go the wrong way.",
    ],
  },
  {
    slug: "building-a-kit-that-lasts",
    title: "Building a Kit That Lasts",
    category: "Style",
    excerpt:
      "Six pieces, chosen once, will outperform a drawer of twenty. What to buy, in what order, and what to stop buying.",
    readMinutes: 4,
    date: "2026-05-22",
    author: "CHISSELED Studio",
    tone: "apparel",
    body: [
      "A functional training wardrobe is smaller than most people's. Six well-chosen pieces cover five sessions a week with one wash cycle, and every additional item past that point is mostly storing itself.",
      "The order matters. Buy the thing closest to your skin first: whatever the session actually depends on. For most women that is the bra, for most men it is the short — specifically the liner. These are the pieces where a bad choice ruins the session and a good one disappears.",
      "Second, buy the layer you will wear most often, in the most neutral colour available. This piece will be photographed, worn out of the gym, and washed more than anything else you own. Pay for the version that survives it.",
      "Third, and only third, buy something because you like how it looks. There is nothing wrong with this — clothes that you want to put on are clothes you put on — but it should follow the two functional decisions rather than lead them.",
      "What to stop buying: anything bought because it was reduced, anything in a colour you own three of, and any garment where the fabric composition is not on the page. That last one is the most reliable filter there is.",
    ],
  },
];

/* ==================================================================
   WORLDS
   ================================================================== */

export interface World {
  slug: WorldSlug;
  name: string;
  statement: string;
  lines: string[];
  tone: "apparel" | "train" | "fuel" | "recover" | "void";
  pose: "front" | "back";
  anchor: number;
}

export const WORLDS: World[] = [
  {
    slug: "women",
    name: "Women",
    statement: "Power looks good on you.",
    lines: ["Women's Activewear", "Sports Bras", "Performance Essentials"],
    tone: "apparel",
    pose: "front",
    anchor: 0.42,
  },
  {
    slug: "men",
    name: "Men",
    statement: "Built for the work.",
    lines: ["Men's Activewear", "Training Essentials", "Performance Wear"],
    tone: "void",
    pose: "back",
    anchor: 0.56,
  },
  {
    slug: "accessories",
    name: "Accessories",
    statement: "The details that carry the rest.",
    lines: ["Bags", "Compression Socks", "Training Accessories"],
    tone: "recover",
    pose: "front",
    anchor: 0.5,
  },
  {
    slug: "performance",
    name: "Performance",
    statement: "Fuel the work.",
    lines: ["Supplements", "Recovery", "Nutrition"],
    tone: "fuel",
    pose: "back",
    anchor: 0.48,
  },
];

/* ==================================================================
   ACCESSORS
   Every surface reads through these, so swapping in a commerce
   backend is a change to this block and nothing else.
   ================================================================== */

export function getProducts(): Product[] {
  return PRODUCTS;
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductsByWorld(world: WorldSlug): Product[] {
  return PRODUCTS.filter((p) => p.world === world);
}

export function getFeatured(): Product[] {
  return [
    "axis-sculpt-legging",
    "forge-training-tee",
    "meridian-bra",
    "grind-training-short",
    "thermal-shell-jacket",
    "base-whey-isolate",
  ]
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p));
}

export function getNewArrivals(): Product[] {
  return PRODUCTS.filter((p) => p.isNew);
}

export function getBundle(slug: string): Bundle | undefined {
  return BUNDLES.find((b) => b.slug === slug);
}

export function getProgram(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getAthlete(slug: string): Athlete | undefined {
  return ATHLETES.find((a) => a.slug === slug);
}

export function getWorld(slug: string): World | undefined {
  return WORLDS.find((w) => w.slug === slug);
}

export function relatedProducts(product: Product): Product[] {
  return product.related
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p));
}

/** Total stock across every colourway — drives the scarcity signal honestly. */
export function stockLevel(product: Product): "in" | "low" | "out" {
  const total = product.variants.reduce((n, v) => n + v.inStock.length, 0);
  const low = product.variants.reduce((n, v) => n + v.low.length, 0);
  if (total === 0) return "out";
  if (low >= total * 0.6) return "low";
  return "in";
}
