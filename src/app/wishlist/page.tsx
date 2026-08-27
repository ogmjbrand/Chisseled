import { WishlistView } from "@/components/product/WishlistView";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Wishlist",
    description: "The pieces you've saved.",
    path: "/wishlist",
  }),
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return <WishlistView />;
}
