import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/shell/Header";
import { Footer } from "@/components/shell/Footer";
import { CartDrawer } from "@/components/shell/CartDrawer";
import { SearchOverlay } from "@/components/shell/SearchOverlay";
import { RevealRoot } from "@/components/shell/RevealRoot";
import { GrainDefs } from "@/components/primitives/Visual";
import { JsonLd } from "@/components/primitives/JsonLd";
import { StoreProvider } from "@/lib/store";
import { SITE, organizationSchema, websiteSchema } from "@/lib/seo";

/**
 * Archivo carries a width axis, which is what lets the display type go
 * genuinely wide at hero scale rather than just large. Plex Mono is the
 * technical voice — labels, data, eyebrows. Inter does the reading.
 */
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  axes: ["wdth"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Built for the Disciplined`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: "CHISSELED" }],
  creator: "CHISSELED",
  publisher: "CHISSELED",
  keywords: [
    "performance apparel",
    "training programmes",
    "sports nutrition",
    "compression wear",
    "activewear",
    "gym clothing",
  ],
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    title: `${SITE.name} — Built for the Disciplined`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#050506",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />

        <StoreProvider>
          <RevealRoot />
          <GrainDefs />
          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchOverlay />
        </StoreProvider>
      </body>
    </html>
  );
}
