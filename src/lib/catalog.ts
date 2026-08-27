import { reviewsFor } from "@/lib/reviews";
import type { Article, Athlete, Bundle, CollectionSlug, Product, Program } from "@/lib/types";

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
  /* ================= SCARRED COLLECTION ================= */
  {
    slug: "scarred-hoodie",
    name: "Scarred Hoodie",
    tagline: "Stronger today. The scar is the proof, not the wound.",
    collection: "scarred",
    gender: "unisex",
    category: "Hoodies",
    price: 11800,
    flat: "hoodie",
    media: {
      onyx: "scarred-hoodie--onyx",
      royal: "scarred-hoodie--royal",
      graphite: "scarred-hoodie--graphite",
      blush: "scarred-hoodie--blush",
      sage: "scarred-hoodie--sage",
    },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: ["XXL"] },
      { colorway: "royal", inStock: ["M", "L", "XL"], low: ["M"] },
      { colorway: "graphite", inStock: ["S", "M", "L", "XL"], low: ["S"] },
      { colorway: "sage", inStock: ["M", "L", "XL"], low: ["XL"] },
      { colorway: "blush", inStock: ["S", "M", "L"], low: ["L"] },
    ],
    activities: ["lifting", "training", "everyday"],
    fit: "oversized",
    badges: ["Signature"],
    story:
      "SCARRED is the piece the brand is named around. The chest graphic reads STRONGER TODAY under a mark that is deliberately imperfect — scar tissue is denser than the skin it replaces, and that is the whole argument. It is cut oversized on purpose: this is what you pull on over a soaked training layer walking out to the car, not something you are trying to look sharp in.",
    benefits: [
      { title: "Heavyweight fleece", detail: "380gsm brushed-back cotton fleece. It has weight in the hand and it keeps it through the wash cycle." },
      { title: "Printed, not patched", detail: "The graphic is a soft-hand plastisol print that flexes with the fabric instead of sitting on top of it as a plate." },
      { title: "Ribbed everywhere it matters", detail: "2x1 rib at the cuff and hem, so the sleeves stay where you push them." },
      { title: "Double-lined hood", detail: "Holds its shape up or down rather than collapsing flat across the shoulders." },
    ],
    fabric: "80% cotton, 20% polyester. 380gsm brushed-back fleece, garment washed.",
    care: "Cold wash inside out. Tumble low. Do not iron the graphic.",
    modelNote: "Model is 6'1\" / 185cm, wears size L for the oversized fit.",
    rating: 4.9,
    reviewCount: 842,
    reviews: reviewsFor("outer", "scarred-hoodie"),
    related: ["ch-cropped-sweatshirt", "tech-fleece-set", "performance-crew-sock"],
    tone: "void",
  },

  /* ================= CH MONOGRAM ================= */
  {
    slug: "ch-cropped-sweatshirt",
    name: "CH Cropped Sweatshirt",
    tagline: "The monogram, cut short and left alone.",
    collection: "monogram",
    gender: "women",
    category: "Sweatshirts",
    price: 6800,
    flat: "crop",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "heather", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "bone", inStock: ["XS", "S", "M", "L"], low: ["XS"] },
    ],
    activities: ["training", "everyday"],
    fit: "relaxed",
    badges: ["Best Seller"],
    story:
      "The CH diamond is the quietest thing we make and the piece that sells fastest. Cropped at the natural waist so it sits above a high-rise legging without riding, and cut wide enough through the body that it reads as outerwear rather than as a shrunken sweatshirt.",
    benefits: [
      { title: "Cropped to the waist", detail: "Hits at the narrowest point rather than mid-rib, which is where cropped sweatshirts usually go wrong." },
      { title: "Dropped shoulder", detail: "The seam sits down the arm, so the silhouette stays soft instead of structured." },
      { title: "Embroidered mark", detail: "The diamond is stitched, not printed — it survives the garment." },
    ],
    fabric: "70% cotton, 30% polyester. 320gsm loopback terry.",
    care: "Cold wash. Tumble low. Reshape while damp.",
    modelNote: "Model is 5'7\" / 170cm, wears size S.",
    rating: 4.8,
    reviewCount: 1103,
    reviews: reviewsFor("top", "ch-cropped-sweatshirt"),
    related: ["seamless-sports-bra", "fitted-training-set", "scarred-hoodie"],
    tone: "apparel",
    isNew: true,
  },
  {
    slug: "chisseled-tee",
    name: "CHISSELED Tee",
    tagline: "Wordmark across the chest. Nothing else asked of it.",
    collection: "monogram",
    gender: "unisex",
    category: "T-Shirts",
    price: 4200,
    flat: "tee",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "royal", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: ["S"] },
      { colorway: "bone", inStock: ["M", "L", "XL"], low: ["M"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    story:
      "A mid-weight cotton tee with the wordmark set wide across the chest. We kept the body straight rather than tapered — a training tee that fits like a training tee, not like a going-out shirt that happens to be cotton.",
    benefits: [
      { title: "Mid-weight, not thin", detail: "190gsm holds its shape across the shoulders instead of clinging after one session." },
      { title: "Side-seamed", detail: "Sewn as a proper garment rather than a tube, so it hangs straight." },
      { title: "Taped neck", detail: "The collar keeps its circle after repeated pulling on and off." },
    ],
    fabric: "100% combed ring-spun cotton. 190gsm single jersey.",
    care: "Cold wash with like colours. Tumble low.",
    modelNote: "Model is 6'0\" / 183cm, wears size M.",
    rating: 4.7,
    reviewCount: 596,
    reviews: reviewsFor("top", "chisseled-tee"),
    related: ["scarred-hoodie", "ch-cropped-sweatshirt", "performance-crew-sock"],
    tone: "apparel",
  },

  {
    slug: "ch-monogram-set",
    name: "CH Monogram Set",
    tagline: "Tee and short, cut and dyed together.",
    collection: "monogram",
    gender: "women",
    category: "Sets",
    price: 7800,
    flat: "tee",
    media: { onyx: "ch-monogram-set--onyx", heather: "ch-monogram-set--heather" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "heather", inStock: ["S", "M", "L"], low: ["M"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    badges: ["Set"],
    story:
      "A fitted tee over a drawstring short, dyed in one bath so the two pieces read as one garment. The monogram sits small on the chest and repeats on the leg — the mark twice, quietly, rather than once and loudly.",
    benefits: [
      { title: "Dyed as a set", detail: "Both pieces from the same lot, so the greys match rather than nearly match." },
      { title: "Drawstring short", detail: "A flat inner cord that ties without bulking under the waistband." },
      { title: "Side-seam pockets", detail: "Deep enough for a phone, bar-tacked at both ends." },
    ],
    fabric: "92% cotton, 8% elastane. 220gsm interlock.",
    care: "Cold wash with like colours. Tumble low.",
    modelNote: "Model is 5'7\" / 170cm, wears size S.",
    rating: 4.8,
    reviewCount: 512,
    reviews: reviewsFor("top", "ch-monogram-set"),
    related: ["ch-crop-set", "ch-cropped-sweatshirt", "cropped-long-sleeve"],
    tone: "apparel",
    isNew: true,
  },
  {
    slug: "ch-crop-set",
    name: "CH Ribbed Crop Set",
    tagline: "Ribbed tank, matched short, nothing spare.",
    collection: "monogram",
    gender: "women",
    category: "Sets",
    price: 8200,
    flat: "crop",
    media: { sand: "ch-crop-set--sand" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "sand", inStock: ["XS", "S", "M", "L"], low: ["L"] },
      { colorway: "onyx", inStock: ["S", "M", "L"], low: [] },
    ],
    activities: ["training", "everyday"],
    fit: "sculpt",
    badges: ["Set"],
    story:
      "A high-neck ribbed tank over a mid-rise short. The rib is knitted fine enough to hold shape through a session and open enough to move — most ribbed tanks pick one and give up the other.",
    benefits: [
      { title: "Fine rib", detail: "Holds its shape at the neckline instead of stretching out after a wash." },
      { title: "High neck", detail: "Covers without a strap showing under a layer." },
      { title: "Mid-rise short", detail: "Sits below the navel with a wide flat waistband that does not roll." },
    ],
    fabric: "88% nylon, 12% elastane. Fine-gauge rib.",
    care: "Cold wash in a mesh bag. Hang dry.",
    modelNote: "Model is 5'8\" / 173cm, wears size S.",
    rating: 4.7,
    reviewCount: 288,
    reviews: reviewsFor("top", "ch-crop-set"),
    related: ["ch-monogram-set", "seamless-sports-bra", "cropped-long-sleeve"],
    tone: "apparel",
    isNew: true,
  },

  /* ================= STATEMENT ================= */
  {
    slug: "get-it-together-tee",
    name: "Get It Together Tee",
    tagline: "The one you wear on the day it applies.",
    collection: "statement",
    gender: "unisex",
    category: "T-Shirts",
    price: 4200,
    flat: "tee",
    media: {
      royal: "get-it-together-tee--royal",
      red: "get-it-together-tee--red",
      heather: "get-it-together-tee--heather",
      onyx: "get-it-together-tee--onyx",
    },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "royal", inStock: ["S", "M", "L", "XL"], low: ["S"] },
      { colorway: "red", inStock: ["M", "L", "XL"], low: ["XL"] },
      { colorway: "heather", inStock: ["S", "M", "L", "XL"], low: ["M"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    badges: ["Statement"],
    story:
      "Script lettering with a hard drop shadow, set large across the chest. It is a joke you are in on — the kind of shirt that gets worn until the print cracks, which is the only honest measure of a graphic tee.",
    benefits: [
      { title: "Soft-hand print", detail: "Flexes with the jersey rather than sitting on it as a plate." },
      { title: "Mid-weight body", detail: "190gsm — holds shape across the shoulders after repeated washing." },
      { title: "Taped neck", detail: "The collar keeps its circle." },
    ],
    fabric: "100% combed ring-spun cotton. 190gsm single jersey.",
    care: "Cold wash inside out. Tumble low. Do not iron the print.",
    modelNote: "Model is 6'0\" / 183cm, wears size M.",
    rating: 4.7,
    reviewCount: 431,
    reviews: reviewsFor("top", "get-it-together-tee"),
    related: ["here-to-tee", "not-with-da-tee", "chisseled-tee"],
    tone: "apparel",
    isNew: true,
  },
  {
    slug: "here-to-tee",
    name: "Here To Tee",
    tagline: "Says the quiet part out loud.",
    collection: "statement",
    gender: "unisex",
    category: "T-Shirts",
    price: 4200,
    flat: "tee",
    media: { red: "here-to-tee--red", onyx: "here-to-tee--onyx" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: ["S"] },
      { colorway: "red", inStock: ["M", "L", "XL"], low: ["M"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    badges: ["Statement"],
    story:
      "Hand-lettered across the chest with the CH mark on the sleeve. It is not subtle and it is not trying to be — some sessions want a shirt that already knows what kind of day it is.",
    benefits: [
      { title: "Sleeve mark", detail: "The monogram sits on the sleeve so the chest carries one idea, not two." },
      { title: "Soft-hand print", detail: "Flexes with the jersey instead of cracking across the chest." },
      { title: "Side-seamed", detail: "Sewn as a garment rather than a tube, so it hangs straight." },
    ],
    fabric: "100% combed ring-spun cotton. 190gsm single jersey.",
    care: "Cold wash inside out. Tumble low.",
    modelNote: "Model is 6'1\" / 185cm, wears size L.",
    rating: 4.6,
    reviewCount: 267,
    reviews: reviewsFor("top", "here-to-tee"),
    related: ["get-it-together-tee", "not-with-da-tee", "scarred-hoodie"],
    tone: "void",
  },
  {
    slug: "not-with-da-tee",
    name: "Not With Da Tee",
    tagline: "A boundary, printed.",
    collection: "statement",
    gender: "unisex",
    category: "T-Shirts",
    price: 4200,
    flat: "tee",
    media: { onyx: "not-with-da-tee--onyx" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: ["XXL"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    badges: ["Statement"],
    story:
      "Underlined script with an arrow, set off-centre. The composition is deliberately lopsided — centred type would have made it a slogan, and off-centre makes it a remark.",
    benefits: [
      { title: "Off-centre placement", detail: "Set left of the chest so it reads as an aside rather than a banner." },
      { title: "Sleeve mark", detail: "The CH monogram on the sleeve, small." },
      { title: "Mid-weight body", detail: "190gsm, taped neck, side-seamed." },
    ],
    fabric: "100% combed ring-spun cotton. 190gsm single jersey.",
    care: "Cold wash inside out. Tumble low.",
    modelNote: "Model is 6'0\" / 183cm, wears size M.",
    rating: 4.5,
    reviewCount: 184,
    reviews: reviewsFor("top", "not-with-da-tee"),
    related: ["get-it-together-tee", "here-to-tee", "chisseled-tee"],
    tone: "void",
  },

  /* ================= CAMO COLLECTION ================= */
  {
    slug: "camo-hoodie-set",
    name: "Camo Hoodie Set",
    tagline: "Two pieces, one print, cut to be worn apart.",
    collection: "camo",
    gender: "unisex",
    category: "Sets",
    price: 14800,
    flat: "hoodie",
    media: {
      deer: "camo-hoodie-set--deer",
      boar: "camo-hoodie-set--boar",
      ibex: "camo-hoodie-set--ibex",
    },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "deer", inStock: ["S", "M", "L", "XL", "XXL"], low: ["XXL"] },
      { colorway: "boar", inStock: ["M", "L", "XL"], low: ["M"] },
      { colorway: "ibex", inStock: ["S", "M", "L", "XL"], low: ["S"] },
    ],
    activities: ["training", "everyday"],
    fit: "relaxed",
    badges: ["Set"],
    story:
      "A hooded top and matching jogger in an all-over woodland print. Sets usually fail because the print is cut without regard for where the pattern lands on the body — this one is placed panel by panel so the repeat runs continuously across the shoulder and down the leg rather than breaking at every seam.",
    benefits: [
      { title: "Placed print", detail: "The repeat is aligned across seams instead of cut wherever the roll happened to land." },
      { title: "Wears apart", detail: "Both pieces are designed to hold up on their own, because that is how sets actually get worn." },
      { title: "Zip pockets on the jogger", detail: "Phone stays put through a warm-up." },
    ],
    fabric: "Poly-cotton fleece with a sublimated all-over print. 300gsm.",
    care: "Cold wash inside out. Hang dry to protect the print.",
    modelNote: "Model is 5'11\" / 180cm, wears size M.",
    rating: 4.7,
    reviewCount: 318,
    reviews: reviewsFor("outer", "camo-hoodie-set"),
    related: ["scarred-hoodie", "tech-fleece-set", "chisseled-sling-bag"],
    tone: "void",
  },

  /* ================= TRACKSUITS ================= */
  {
    slug: "heavyweight-hoodie-set",
    name: "Heavyweight Hoodie Set",
    tagline: "The one you live in from October onward.",
    collection: "tracksuits",
    gender: "unisex",
    category: "Sets",
    price: 15800,
    flat: "hoodie",
    media: "hoodie-green",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "sage", inStock: ["S", "M", "L", "XL"], low: ["S"] },
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "royal", inStock: ["M", "L", "XL"], low: ["XL"] },
    ],
    activities: ["training", "recovery", "everyday"],
    fit: "relaxed",
    badges: ["Set"],
    story:
      "Heavyweight fleece top and matching jogger. This is the warm-up layer and the walk-home layer — most of its life is spent either side of the session rather than during it, so we built for warmth and durability rather than for breathability it would never use.",
    benefits: [
      { title: "420gsm fleece", detail: "Genuinely heavy. It holds heat through a cold gym and a colder car park." },
      { title: "Tapered leg, ribbed cuff", detail: "The jogger stops at the ankle instead of pooling over the shoe." },
      { title: "Reinforced pocket bags", detail: "Bar-tacked at the stress points, because pockets are where these fail first." },
    ],
    fabric: "75% cotton, 25% polyester. 420gsm brushed fleece.",
    care: "Cold wash. Tumble low. Wash the set together so the colours age at the same rate.",
    modelNote: "Model is 6'0\" / 183cm, wears size L.",
    rating: 4.9,
    reviewCount: 671,
    reviews: reviewsFor("outer", "heavyweight-hoodie-set"),
    related: ["tech-fleece-set", "scarred-hoodie", "performance-crew-sock"],
    tone: "void",
  },
  {
    slug: "tech-fleece-set",
    name: "Tech Fleece Set",
    tagline: "Lighter, sharper, cut closer to the body.",
    collection: "tracksuits",
    gender: "unisex",
    category: "Sets",
    price: 16800,
    flat: "jacket",
    media: { heather: "tech-fleece-set--heather" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "heather", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "onyx", inStock: ["S", "M", "L", "XL", "XXL"], low: [] },
      { colorway: "graphite", inStock: ["M", "L", "XL"], low: ["M"] },
    ],
    activities: ["training", "running", "everyday"],
    fit: "regular",
    badges: ["Best Seller"],
    story:
      "Where the heavyweight set is built for standing still in the cold, this one is built for moving in it. A bonded three-layer fleece that is warm without bulk, cut closer through the body and the leg so it does not flap on a run.",
    benefits: [
      { title: "Bonded three-layer", detail: "A smooth face, an insulating core and a soft back, laminated rather than stitched — warm at half the thickness." },
      { title: "Full-length zip", detail: "Vents fast when you overheat mid-session instead of forcing the whole layer off." },
      { title: "Articulated knee", detail: "The jogger is shaped at the knee so the fabric bends where your leg does." },
    ],
    fabric: "Bonded polyester-spandex three-layer fleece. 300gsm.",
    care: "Cold wash. Hang dry. No fabric softener.",
    modelNote: "Model is 5'11\" / 180cm, wears size M.",
    rating: 4.8,
    reviewCount: 924,
    reviews: reviewsFor("outer", "tech-fleece-set"),
    related: ["heavyweight-hoodie-set", "chisseled-sling-bag", "performance-crew-sock"],
    tone: "apparel",
  },
  {
    slug: "womens-hoodie-set",
    name: "Women's Hoodie Set",
    tagline: "Cropped on top, high-rise below, matched exactly.",
    collection: "tracksuits",
    gender: "women",
    category: "Sets",
    price: 13800,
    flat: "crop",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L"], low: ["XS"] },
      { colorway: "royal", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "heather", inStock: ["S", "M", "L"], low: ["M"] },
    ],
    activities: ["training", "everyday"],
    fit: "sculpt",
    story:
      "A cropped hooded top over a high-rise jogger, dyed in the same bath so the two pieces actually match rather than nearly matching. The gap between hem and waistband is deliberate and consistent across the size run.",
    benefits: [
      { title: "Dyed as a set", detail: "Both pieces come from the same dye lot, so the greys are the same grey." },
      { title: "High-rise, wide band", detail: "A 10cm waistband that sits above the navel and stays there." },
      { title: "Graded crop", detail: "The hem length is graded by size rather than fixed, so it hits the same point on every body." },
    ],
    fabric: "68% cotton, 32% polyester. 300gsm loopback terry.",
    care: "Cold wash with like colours. Tumble low.",
    modelNote: "Model is 5'8\" / 173cm, wears size S.",
    rating: 4.8,
    reviewCount: 487,
    reviews: reviewsFor("top", "womens-hoodie-set"),
    related: ["ch-cropped-sweatshirt", "fitted-training-set", "seamless-sports-bra"],
    tone: "apparel",
    isNew: true,
  },

  /* ================= PERFORMANCE ESSENTIALS ================= */
  {
    slug: "fitted-training-set",
    name: "Fitted Training Set",
    tagline: "Long sleeve and legging, cut as one garment in two parts.",
    collection: "essentials",
    gender: "women",
    category: "Sets",
    price: 9500,
    flat: "leggings",
    media: "fitted-set",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "royal", inStock: ["S", "M", "L"], low: ["S"] },
      { colorway: "violet", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
    ],
    activities: ["lifting", "training", "yoga"],
    fit: "compression",
    badges: ["Signature"],
    story:
      "A hooded long-sleeve over a high-rise legging in a matched compression knit. The two pieces share a seam logic — the panel lines carry from the torso into the leg, so the set reads as a single silhouette when worn together and still works apart.",
    benefits: [
      { title: "Continuous seam line", detail: "Panels align between top and legging, which is why the set photographs as one piece." },
      { title: "Squat-tested opacity", detail: "Every colourway is checked at depth under direct light before it ships." },
      { title: "Thumbholes", detail: "The sleeve stays down through a warm-up without being held." },
    ],
    fabric: "72% recycled polyamide, 28% elastane. 280gsm double-knit.",
    care: "Cold wash. Hang dry. No fabric softener — it coats the fibre and kills the recovery.",
    modelNote: "Model is 5'9\" / 175cm, wears size S.",
    rating: 4.9,
    reviewCount: 1382,
    reviews: reviewsFor("leggings", "fitted-training-set"),
    related: ["seamless-sports-bra", "three-piece-training-set", "ch-cropped-sweatshirt"],
    tone: "apparel",
  },
  {
    slug: "three-piece-training-set",
    name: "3-Piece Training Set",
    tagline: "Bra, legging, layer. The whole session covered.",
    collection: "essentials",
    gender: "women",
    category: "Sets",
    price: 12800,
    flat: "leggings",
    media: "workout-set",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: ["XL"] },
      { colorway: "graphite", inStock: ["S", "M", "L"], low: [] },
      { colorway: "violet", inStock: ["S", "M", "L"], low: ["L"] },
    ],
    activities: ["lifting", "training", "yoga", "everyday"],
    fit: "compression",
    badges: ["Set"],
    story:
      "Sports bra, high-rise legging and a cropped layer, matched and sold together. It exists because the three-item cart was the most common order we saw, and buying it as a set should cost less than assembling it piece by piece.",
    benefits: [
      { title: "Three matched pieces", detail: "Bra, legging and layer in one dye lot, sized as a set." },
      { title: "Cheaper than the parts", detail: "Priced below the sum of the three bought separately." },
      { title: "Layer packs flat", detail: "The cropped top folds into a bag without creasing into the print." },
    ],
    fabric: "72% recycled polyamide, 28% elastane throughout. 280gsm.",
    care: "Cold wash. Hang dry. Wash the set together.",
    modelNote: "Model is 5'7\" / 170cm, wears size S.",
    rating: 4.9,
    reviewCount: 764,
    reviews: reviewsFor("leggings", "three-piece-training-set"),
    related: ["fitted-training-set", "seamless-sports-bra", "womens-hoodie-set"],
    tone: "apparel",
  },
  {
    slug: "seamless-sports-bra",
    name: "Seamless Sports Bra",
    tagline: "Support that still lets you take a full breath.",
    collection: "essentials",
    gender: "women",
    category: "Sports Bras",
    price: 5800,
    flat: "bra",
    media: "sports-bra",
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "graphite", inStock: ["XS", "S", "M", "L", "XL"], low: [] },
      { colorway: "onyx", inStock: ["XS", "S", "M", "L", "XL"], low: ["XS"] },
      { colorway: "blush", inStock: ["S", "M", "L"], low: ["L"] },
      { colorway: "violet", inStock: ["S", "M", "L", "XL"], low: ["XL"] },
    ],
    activities: ["running", "training", "lifting", "yoga"],
    fit: "compression",
    badges: ["Best Seller"],
    story:
      "High-support bras usually solve movement by removing room to breathe. We treated support and respiration as two separate problems: the underband is wide and load-spreading, the cross-back straps anchor at the shoulder blade, and the rib panel is knitted more elastic than the rest of the garment so the diaphragm can still expand under load.",
    benefits: [
      { title: "Breathing rib panel", detail: "A more elastic knit across the lower rib lets the diaphragm expand fully under load." },
      { title: "Load-spreading band", detail: "A 5cm underband distributes pressure rather than concentrating it into a line." },
      { title: "Cross-back straps", detail: "Anchored at the shoulder blade so nothing slides during overhead work." },
      { title: "Seamless body", detail: "Knitted in the round — no side seams to abrade on a long run." },
    ],
    fabric: "Seamless nylon-elastane knit. 240gsm with a matte hand.",
    care: "Cold wash in a mesh bag. Hang dry.",
    modelNote: "Model is 5'8\" / 173cm, wears size S.",
    rating: 4.8,
    reviewCount: 1596,
    reviews: reviewsFor("bra", "seamless-sports-bra"),
    related: ["fitted-training-set", "three-piece-training-set", "ch-cropped-sweatshirt"],
    tone: "apparel",
  },
  {
    slug: "cropped-long-sleeve",
    name: "Cropped Long Sleeve",
    tagline: "The layer that goes over everything else here.",
    collection: "essentials",
    gender: "women",
    category: "Tops",
    price: 4800,
    flat: "crop",
    media: { onyx: "cropped-long-sleeve--onyx" },
    sizes: APPAREL_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["XS", "S", "M", "L"], low: [] },
      { colorway: "royal", inStock: ["S", "M", "L"], low: ["S"] },
      { colorway: "heather", inStock: ["XS", "S", "M", "L", "XL"], low: ["XL"] },
    ],
    activities: ["training", "yoga", "everyday"],
    fit: "relaxed",
    story:
      "A cropped long sleeve in a light knit, cut to sit over a bra without adding a layer of heat. It is the piece that makes the rest of the collection wearable outside the gym.",
    benefits: [
      { title: "Light enough to layer", detail: "160gsm — it covers without insulating." },
      { title: "Raw-edge hem", detail: "No band at the hem, so it drapes rather than gripping." },
      { title: "Extended cuff", detail: "Long in the sleeve on purpose; it bunches at the wrist." },
    ],
    fabric: "60% modal, 40% cotton. 160gsm fine jersey.",
    care: "Cold wash. Hang dry.",
    modelNote: "Model is 5'7\" / 170cm, wears size S.",
    rating: 4.6,
    reviewCount: 412,
    reviews: reviewsFor("top", "cropped-long-sleeve"),
    related: ["seamless-sports-bra", "fitted-training-set", "ch-cropped-sweatshirt"],
    tone: "apparel",
  },
  {
    slug: "performance-crew-sock",
    name: "Performance Crew Sock",
    tagline: "Three pairs. Cushioned where the load lands.",
    collection: "essentials",
    gender: "unisex",
    category: "Socks",
    price: 3500,
    flat: "socks",
    media: "socks-gray",
    sizes: SOCK_SIZES,
    variants: [
      { colorway: "heather", inStock: ["S/M", "L/XL"], low: [] },
      { colorway: "onyx", inStock: ["S/M", "L/XL"], low: ["S/M"] },
    ],
    activities: ["lifting", "running", "training"],
    fit: "compression",
    badges: ["3-Pack"],
    story:
      "Sold in threes because nobody needs one pair. Terry cushioning under the heel and the ball of the foot, a flat toe seam, and a ribbed arch band that stops the sock rotating inside the shoe halfway through a run.",
    benefits: [
      { title: "Zoned cushioning", detail: "Terry loops under the heel and forefoot only — the rest stays thin so the shoe still fits." },
      { title: "Arch band", detail: "A ribbed band across the midfoot keeps the sock from rotating." },
      { title: "Flat toe seam", detail: "Linked rather than overlocked, so there is no ridge across the toes." },
    ],
    fabric: "58% combed cotton, 39% polyamide, 3% elastane.",
    care: "Warm wash. Tumble dry.",
    modelNote: "S/M fits US 5–8.5. L/XL fits US 9–13.",
    rating: 4.7,
    reviewCount: 903,
    reviews: reviewsFor("access", "performance-crew-sock"),
    related: ["chisseled-sling-bag", "tech-fleece-set", "scarred-hoodie"],
    tone: "recover",
  },
  {
    slug: "chisseled-sling-bag",
    name: "CHISSELED Sling Bag",
    tagline: "Everything for a session, nothing you do not need.",
    collection: "essentials",
    gender: "unisex",
    category: "Bags",
    price: 4800,
    flat: "bag",
    sizes: ACCESSORY_SIZES,
    variants: [
      { colorway: "onyx", inStock: ["One Size"], low: [] },
      { colorway: "graphite", inStock: ["One Size"], low: ["One Size"] },
    ],
    activities: ["training", "everyday"],
    fit: "regular",
    story:
      "A single-strap sling sized for exactly what a session needs: phone, keys, wallet, wraps, a shaker. It deliberately will not hold a laptop, because the moment a gym bag holds a laptop it stops being a gym bag.",
    benefits: [
      { title: "Sized for a session", detail: "Six litres. Phone, keys, wallet, wraps, shaker — and then it is full." },
      { title: "Water-resistant shell", detail: "600D coated poly sheds a wet walk to the car." },
      { title: "Hidden back pocket", detail: "Sits against your body for the things you would rather not have reachable." },
    ],
    fabric: "600D coated polyester with a water-resistant backing. YKK hardware.",
    care: "Wipe clean. Do not machine wash.",
    modelNote: "6L capacity. Adjustable strap fits 28–48in.",
    rating: 4.6,
    reviewCount: 341,
    reviews: reviewsFor("access", "chisseled-sling-bag"),
    related: ["performance-crew-sock", "tech-fleece-set", "creatine-monohydrate"],
    tone: "recover",
  },
  {
    slug: "creatine-monohydrate",
    name: "Creatine Monohydrate",
    tagline: "The one supplement the evidence actually agrees on.",
    collection: "essentials",
    gender: "unisex",
    category: "Supplements",
    price: 4200,
    flat: "tub",
    sizes: ACCESSORY_SIZES,
    variants: [{ colorway: "onyx", inStock: ["One Size"], low: [] }],
    activities: ["lifting", "training", "recovery"],
    fit: "regular",
    badges: ["Third-Party Tested"],
    story:
      "Micronised creatine monohydrate and nothing else. No proprietary blend, no transport matrix, no flavour system to hide behind. Monohydrate is the form with the research behind it and it is also the cheapest, which is exactly why most brands sell you something else.",
    benefits: [
      { title: "One ingredient", detail: "Micronised creatine monohydrate. There is nothing else in the tub." },
      { title: "Third-party tested", detail: "Every lot is assayed for identity and purity, and the certificate is published." },
      { title: "Micronised", detail: "Finer particle size, so it suspends instead of sitting at the bottom of the glass." },
    ],
    fabric: "Micronised creatine monohydrate. 100% of contents.",
    care: "Store sealed, cool and dry. Use within 12 months of opening.",
    modelNote: "60 servings at 5g. One scoop daily, timing irrelevant.",
    rating: 4.8,
    reviewCount: 728,
    reviews: reviewsFor("fuel", "creatine-monohydrate"),
    related: ["detox-tea", "chisseled-sling-bag", "performance-crew-sock"],
    tone: "fuel",
    nutrition: {
      what: "Micronised creatine monohydrate, 5g per serving.",
      when: "Once daily. Timing does not matter — total daily intake is what drives saturation.",
      who: "Anyone training with resistance. It is the best-evidenced legal ergogenic there is.",
      why: "Creatine restores phosphocreatine between efforts, which is what lets you complete the last hard rep rather than fail it.",
      servings: 60,
      ingredients: [
        { name: "Creatine monohydrate", amount: "5g", note: "Micronised. The only ingredient." },
      ],
      subscribeDiscount: 15,
    },
  },
  {
    slug: "detox-tea",
    name: "14 Day Detox Tea",
    tagline: "A herbal infusion. We will not claim more than that.",
    collection: "essentials",
    gender: "unisex",
    category: "Nutrition",
    price: 3800,
    flat: "sachet",
    sizes: ACCESSORY_SIZES,
    variants: [{ colorway: "sage", inStock: ["One Size"], low: ["One Size"] }],
    activities: ["recovery", "everyday"],
    fit: "regular",
    story:
      "A caffeine-light herbal infusion designed to be drunk in the evening across a fortnight. We are going to be direct about this one: your liver and kidneys handle detoxification, and no tea changes that. What this does is replace an evening habit with a warm, low-sugar one, and for a lot of people that is the change that actually sticks.",
    benefits: [
      { title: "Honest about what it is", detail: "A herbal infusion. It supports a routine, not an organ system." },
      { title: "Caffeine-light", detail: "Under 10mg per cup, so it will not sit between you and sleep." },
      { title: "Whole-leaf sachets", detail: "Pyramid bags with room for the leaf to open, not dust in paper." },
    ],
    fabric: "Nettle, peppermint, dandelion root, ginger, liquorice root, lemon balm.",
    care: "Store sealed and dry. One sachet in 250ml at 90°C for four minutes.",
    modelNote: "14 sachets. One per evening.",
    rating: 4.4,
    reviewCount: 267,
    reviews: reviewsFor("fuel", "detox-tea"),
    related: ["creatine-monohydrate", "performance-crew-sock", "cropped-long-sleeve"],
    tone: "fuel",
    nutrition: {
      what: "A caffeine-light herbal infusion in whole-leaf sachets.",
      when: "Evening, across fourteen consecutive days.",
      who: "Anyone replacing a late snack or a second coffee with something warm and low in sugar.",
      why: "The benefit is behavioural, not metabolic. Changing the evening habit is the mechanism.",
      servings: 14,
      ingredients: [
        { name: "Nettle leaf", amount: "—", note: "Base of the blend." },
        { name: "Peppermint", amount: "—", note: "Carries the aroma." },
        { name: "Dandelion root", amount: "—", note: "Roasted, for body." },
        { name: "Ginger root", amount: "—", note: "Warmth on the finish." },
        { name: "Liquorice root", amount: "—", note: "Sweetness without sugar." },
        { name: "Lemon balm", amount: "—", note: "Traditionally taken in the evening." },
      ],
      subscribeDiscount: 10,
    },
  },
];

export const BUNDLES: Bundle[] = [
  {
    slug: "the-starter",
    name: "The Starter",
    tier: "Entry",
    promise: "Everything you need on day one. Nothing you don't.",
    description:
      "The three pieces that make the first eight weeks feel deliberate rather than improvised: something to train in, something to carry it in, and the one supplement worth taking from the start.",
    items: ["chisseled-tee", "performance-crew-sock", "creatine-monohydrate"],
    price: 10500,
    saves: 1400,
    tone: "apparel",
  },
  {
    slug: "the-performance",
    name: "The Performance",
    tier: "Core",
    promise: "The kit for people already doing the work.",
    description:
      "A matched training set, the bra that holds through it, and cushioning where the load actually lands. This is the bundle most members settle on.",
    items: ["fitted-training-set", "seamless-sports-bra", "performance-crew-sock", "creatine-monohydrate"],
    extras: ["3 months of CHISSELED Training, included"],
    price: 20500,
    saves: 3000,
    tone: "apparel",
  },
  {
    slug: "the-complete",
    name: "The Complete",
    tier: "Full",
    promise: "The whole system, layered for every part of the session.",
    description:
      "Training layer, warm-up layer and walk-home layer, plus what carries them and what you take afterwards. Built for people training five days a week through a cold season.",
    items: ["tech-fleece-set", "scarred-hoodie", "performance-crew-sock", "chisseled-sling-bag", "creatine-monohydrate"],
    extras: ["6 months of CHISSELED Training, included", "Priority access to every drop"],
    price: 34500,
    saves: 5600,
    tone: "void",
  },
  {
    slug: "the-womens-edit",
    name: "The Women's Edit",
    tier: "Curated",
    promise: "Every layer, matched, in one dye lot.",
    description:
      "The three-piece training set with the cropped sweatshirt that goes over it and the socks that go under everything. Chosen so the pieces work together rather than merely coexisting in a drawer.",
    items: ["three-piece-training-set", "ch-cropped-sweatshirt", "performance-crew-sock"],
    extras: ["3 months of CHISSELED Training, included"],
    price: 21500,
    saves: 2600,
    tone: "apparel",
  },
];

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
    photo: "rope-climb",
    name: "Dami Adeyemi",
    role: "Head Coach, Strength",
    discipline: "Powerlifting",
    location: "Miami, FL",
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
    photo: "swim",
    name: "Amina Bello",
    role: "Coach, Conditioning & Recovery",
    discipline: "Endurance",
    location: "Orlando, FL",
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
    photo: "mountain",
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
    photo: "trail",
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
   COLLECTIONS
   ================================================================== */

export interface Collection {
  slug: CollectionSlug;
  name: string;
  statement: string;
  lines: string[];
  tone: "apparel" | "train" | "fuel" | "recover" | "void";
  pose: "front" | "back";
  anchor: number;
}

export const COLLECTIONS: Collection[] = [
  {
    slug: "scarred",
    name: "Scarred",
    statement: "Stronger today.",
    lines: ["Signature Hoodies", "Five Colourways", "Oversized Cut"],
    tone: "void",
    pose: "back",
    anchor: 0.56,
  },
  {
    slug: "monogram",
    name: "CH Monogram",
    statement: "The mark, and nothing else asked of it.",
    lines: ["Cropped Sweatshirts", "Tees", "Embroidered"],
    tone: "apparel",
    pose: "front",
    anchor: 0.42,
  },
  {
    slug: "camo",
    name: "Camo",
    statement: "One print, placed properly.",
    lines: ["Hooded Sets", "All-Over Print", "Unisex"],
    tone: "train",
    pose: "back",
    anchor: 0.5,
  },
  {
    slug: "tracksuits",
    name: "Tracksuits",
    statement: "Before the session and after it.",
    lines: ["Heavyweight Fleece", "Tech Fleece", "Matched Sets"],
    tone: "recover",
    pose: "front",
    anchor: 0.48,
  },
  {
    slug: "statement",
    name: "Statement",
    statement: "Say it on the way in.",
    lines: ["Graphic Tees", "Hand-Lettered", "Unisex"],
    tone: "void",
    pose: "front",
    anchor: 0.5,
  },
  {
    slug: "essentials",
    name: "Performance Essentials",
    statement: "The layer the work actually happens in.",
    lines: ["Training Sets", "Sports Bras", "Socks · Bags · Fuel"],
    tone: "fuel",
    pose: "front",
    anchor: 0.44,
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

export function getProductsByCollection(collection: CollectionSlug): Product[] {
  return PRODUCTS.filter((p) => p.collection === collection);
}

export function getFeatured(): Product[] {
  return [
    "scarred-hoodie",
    "fitted-training-set",
    "seamless-sports-bra",
    "tech-fleece-set",
    "ch-cropped-sweatshirt",
    "three-piece-training-set",
  ]
    .map((s) => getProduct(s))
    .filter((p): p is Product => Boolean(p));
}

/** Anything carrying a nutrition panel — supplements and nutrition, wherever they sit. */
export function getNutritionProducts(): Product[] {
  return PRODUCTS.filter((p) => Boolean(p.nutrition));
}

/** Products cut for a given audience. Gender is a filter, not a collection. */
export function getProductsByGender(gender: Product["gender"]): Product[] {
  return PRODUCTS.filter((p) => p.gender === gender || p.gender === "unisex");
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

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
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
