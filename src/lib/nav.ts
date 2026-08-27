export interface NavLink {
  label: string;
  href: string;
  note?: string;
}

export interface NavColumn {
  title: string;
  links: NavLink[];
}

export interface NavSection {
  label: string;
  href: string;
  columns: NavColumn[];
  /** The editorial panel that anchors the mega menu. */
  feature: {
    eyebrow: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    seed: string;
    tone: "apparel" | "train" | "fuel" | "recover" | "void";
    pose: "front" | "back";
  };
}

export const NAV: NavSection[] = [
  {
    label: "Shop",
    href: "/shop",
    columns: [
      {
        title: "Collections",
        links: [
          { label: "All Products", href: "/shop" },
          { label: "Scarred", href: "/shop/scarred", note: "Signature" },
          { label: "CH Monogram", href: "/shop/monogram" },
          { label: "Camo", href: "/shop/camo" },
          { label: "Tracksuits", href: "/shop/tracksuits" },
        ],
      },
      {
        title: "Essentials",
        links: [
          { label: "All Essentials", href: "/shop/essentials" },
          { label: "Training Sets", href: "/shop/essentials?category=Sets" },
          { label: "Sports Bras", href: "/shop/essentials?category=Sports+Bras" },
          { label: "Socks", href: "/shop/essentials?category=Socks" },
          { label: "Bags", href: "/shop/essentials?category=Bags" },
        ],
      },
      {
        title: "Fuel & Bundles",
        links: [
          { label: "Supplements", href: "/shop/essentials?category=Supplements" },
          { label: "Nutrition", href: "/fuel" },
          { label: "Performance Bundles", href: "/bundles", note: "Save up to $120" },
          { label: "Gift Cards", href: "/about#gifting" },
        ],
      },
    ],
    feature: {
      eyebrow: "New Collection",
      title: "Engineered to Perform",
      body: "The pieces the studio builds everything else around. Squat-tested, seam-mapped, made to survive five sessions a week.",
      href: "/shop",
      cta: "Shop the collection",
      seed: "nav-shop",
      tone: "apparel",
      pose: "front",
    },
  },
  {
    label: "Train",
    href: "/train",
    columns: [
      {
        title: "Programmes",
        links: [
          { label: "All Programmes", href: "/train" },
          { label: "Strength", href: "/train?discipline=Strength" },
          { label: "Physique", href: "/train?discipline=Physique" },
          { label: "Conditioning", href: "/train?discipline=Conditioning" },
          { label: "Mobility & Recovery", href: "/train?discipline=Mobility+%26+Recovery" },
        ],
      },
      {
        title: "Coaching",
        links: [
          { label: "Personal Training", href: "/train#coaching" },
          { label: "Performance Coaching", href: "/train#coaching" },
          { label: "Meet the Coaches", href: "/community" },
        ],
      },
      {
        title: "Membership",
        links: [
          { label: "CHISSELED Training", href: "/train#membership" },
          { label: "Challenges", href: "/train#challenges" },
          { label: "Progress Tracking", href: "/train#platform" },
        ],
      },
    ],
    feature: {
      eyebrow: "The Platform",
      title: "Training, Measured",
      body: "Programmes that read your logged effort and adapt. Not a PDF. A performance system with a coach behind it.",
      href: "/train",
      cta: "Start training",
      seed: "nav-train",
      tone: "train",
      pose: "back",
    },
  },
  {
    label: "Perform",
    href: "/fuel",
    columns: [
      {
        title: "Nutrition",
        links: [
          { label: "All Nutrition", href: "/fuel" },
          { label: "Protein", href: "/fuel#protein" },
          { label: "Performance", href: "/fuel#performance" },
          { label: "Daily Essentials", href: "/fuel#daily" },
        ],
      },
      {
        title: "Recovery",
        links: [
          { label: "Creatine Monohydrate", href: "/product/creatine-monohydrate" },
          { label: "14 Day Detox Tea", href: "/product/detox-tea" },
          { label: "Mobility", href: "/method#recover" },
        ],
      },
      {
        title: "Method",
        links: [
          { label: "The Chisseled Method", href: "/method" },
          { label: "Find Your Fit", href: "/fit", note: "2 minutes" },
        ],
      },
    ],
    feature: {
      eyebrow: "Nutrition",
      title: "Fuel the Work",
      body: "Full-disclosure labels, research-matched doses, third-party tested. Nothing in the tub that isn't doing a job.",
      href: "/fuel",
      cta: "Explore nutrition",
      seed: "nav-fuel",
      tone: "fuel",
      pose: "front",
    },
  },
  {
    label: "Community",
    href: "/community",
    columns: [
      {
        title: "People",
        links: [
          { label: "Athletes", href: "/community#athletes" },
          { label: "Coaches", href: "/community#athletes" },
          { label: "Member Stories", href: "/community#stories" },
        ],
      },
      {
        title: "Journal",
        links: [
          { label: "All Articles", href: "/journal" },
          { label: "Training", href: "/journal?category=Training" },
          { label: "Nutrition", href: "/journal?category=Nutrition" },
          { label: "Recovery", href: "/journal?category=Recovery" },
          { label: "Mindset", href: "/journal?category=Mindset" },
        ],
      },
      {
        title: "Events",
        links: [
          { label: "Challenges", href: "/train#challenges" },
          { label: "Member Events", href: "/community#events" },
        ],
      },
    ],
    feature: {
      eyebrow: "The Community",
      title: "Built by People Who Do the Work",
      body: "Coaches, athletes and members whose progress is the ordinary kind — slow, consistent, and available to anyone.",
      href: "/community",
      cta: "Meet them",
      seed: "nav-community",
      tone: "void",
      pose: "back",
    },
  },
  {
    label: "About",
    href: "/about",
    columns: [
      {
        title: "Brand",
        links: [
          { label: "Our Story", href: "/about" },
          { label: "The Chisseled Method", href: "/method" },
          { label: "How We Make Things", href: "/about#studio" },
        ],
      },
      {
        title: "Support",
        links: [
          { label: "Shipping", href: "/about#shipping" },
          { label: "Returns", href: "/about#returns" },
          { label: "Size Guide", href: "/about#sizing" },
          { label: "Contact", href: "/about#contact" },
        ],
      },
    ],
    feature: {
      eyebrow: "OGMJ Brands",
      title: "Your Body Is the Project",
      body: "CHISSELED exists because most performance brands sell an image. We would rather sell the thing that produces it.",
      href: "/about",
      cta: "Read our story",
      seed: "nav-about",
      tone: "void",
      pose: "front",
    },
  },
];

export const FOOTER_COLUMNS: NavColumn[] = [
  {
    title: "Shop",
    links: [
      { label: "Scarred", href: "/shop/scarred" },
      { label: "CH Monogram", href: "/shop/monogram" },
      { label: "Camo", href: "/shop/camo" },
      { label: "Tracksuits", href: "/shop/tracksuits" },
      { label: "Performance Essentials", href: "/shop/essentials" },
      { label: "Bundles", href: "/bundles" },
      { label: "Gift Cards", href: "/about#gifting" },
    ],
  },
  {
    title: "Train",
    links: [
      { label: "Programmes", href: "/train" },
      { label: "Personal Training", href: "/train#coaching" },
      { label: "Challenges", href: "/train#challenges" },
      { label: "Membership", href: "/train#membership" },
    ],
  },
  {
    title: "Perform",
    links: [
      { label: "Nutrition", href: "/fuel" },
      { label: "Recovery", href: "/fuel#recovery" },
      { label: "The Method", href: "/method" },
      { label: "Find Your Fit", href: "/fit" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Athletes", href: "/community#athletes" },
      { label: "Journal", href: "/journal" },
      { label: "Stories", href: "/community#stories" },
      { label: "Events", href: "/community#events" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "The Studio", href: "/about#studio" },
      { label: "Careers", href: "/about#careers" },
      { label: "OGMJ Brands", href: "/about#ogmj" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Shipping", href: "/about#shipping" },
      { label: "Returns", href: "/about#returns" },
      { label: "Size Guide", href: "/about#sizing" },
      { label: "Contact", href: "/about#contact" },
      { label: "Accessibility", href: "/about#accessibility" },
    ],
  },
];
