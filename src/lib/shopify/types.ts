/**
 * Shopify Storefront API types — only the shapes this project actually
 * consumes, hand-written against the GraphQL selections in `queries.ts`
 * rather than generated, since the query surface here is small and fixed.
 */

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ShopifySelectedOption {
  name: string;
  value: string;
}

export interface ShopifyProductOption {
  name: string;
  values: string[];
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  selectedOptions: ShopifySelectedOption[];
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  description: string;
  featuredImage: ShopifyImage | null;
  images: ShopifyImage[];
  options: ShopifyProductOption[];
  variants: ShopifyProductVariant[];
  priceRange: { minVariantPrice: ShopifyMoney; maxVariantPrice: ShopifyMoney };
  compareAtPriceRange: { minVariantPrice: ShopifyMoney; maxVariantPrice: ShopifyMoney };
  tags: string[];
  availableForSale: boolean;
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
}

export interface ShopifyCartLineMerchandise {
  id: string;
  title: string;
  selectedOptions: ShopifySelectedOption[];
  price: ShopifyMoney;
  product: { handle: string; title: string; featuredImage: ShopifyImage | null };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  cost: { totalAmount: ShopifyMoney };
  merchandise: ShopifyCartLineMerchandise;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: ShopifyMoney;
    totalAmount: ShopifyMoney;
  };
  lines: ShopifyCartLine[];
}

export interface ShopifyUserError {
  field: string[] | null;
  message: string;
}

/** Generic result envelope every Shopify call in this project returns — never throws for an expected failure. */
export interface ShopifyResult<T> {
  data: T | null;
  /** True when the request never reached Shopify at all (network/config) vs. a GraphQL-level error. */
  networkError: boolean;
  errors?: string[];
}
