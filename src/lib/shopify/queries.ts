/**
 * GraphQL documents for the Shopify Storefront API. Field selections are kept
 * to exactly what `src/lib/shopify/index.ts` and its mappers consume — no
 * speculative fields "in case they're useful later."
 */

const MONEY_FIELDS = `amount currencyCode`;

const IMAGE_FIELDS = `url altText width height`;

const PRODUCT_VARIANT_FIELDS = `
  id
  title
  availableForSale
  quantityAvailable
  selectedOptions { name value }
  price { ${MONEY_FIELDS} }
  compareAtPrice { ${MONEY_FIELDS} }
`;

const PRODUCT_FIELDS = `
  id
  handle
  title
  descriptionHtml
  description
  availableForSale
  tags
  featuredImage { ${IMAGE_FIELDS} }
  images(first: 10) { edges { node { ${IMAGE_FIELDS} } } }
  options { name values }
  priceRange { minVariantPrice { ${MONEY_FIELDS} } maxVariantPrice { ${MONEY_FIELDS} } }
  compareAtPriceRange { minVariantPrice { ${MONEY_FIELDS} } maxVariantPrice { ${MONEY_FIELDS} } }
  variants(first: 100) { edges { node { ${PRODUCT_VARIANT_FIELDS} } } }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges { node { ${PRODUCT_FIELDS} } cursor }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      edges { node { id handle title description image { ${IMAGE_FIELDS} } } }
    }
  }
`;

export const COLLECTION_BY_HANDLE_QUERY = `
  query CollectionByHandle($handle: String!, $first: Int!) {
    collectionByHandle(handle: $handle) {
      id
      handle
      title
      description
      image { ${IMAGE_FIELDS} }
      products(first: $first) {
        edges { node { ${PRODUCT_FIELDS} } }
      }
    }
  }
`;

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost {
    subtotalAmount { ${MONEY_FIELDS} }
    totalAmount { ${MONEY_FIELDS} }
  }
  lines(first: 100) {
    edges {
      node {
        id
        quantity
        cost { totalAmount { ${MONEY_FIELDS} } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            price { ${MONEY_FIELDS} }
            product { handle title featuredImage { ${IMAGE_FIELDS} } }
          }
        }
      }
    }
  }
`;

const USER_ERROR_FIELDS = `userErrors { field message }`;

export const CART_QUERY = `
  query Cart($cartId: ID!) {
    cart(id: $cartId) { ${CART_FIELDS} }
  }
`;

export const CART_CREATE_MUTATION = `
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart { ${CART_FIELDS} }
      ${USER_ERROR_FIELDS}
    }
  }
`;

export const CART_LINES_ADD_MUTATION = `
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ${CART_FIELDS} }
      ${USER_ERROR_FIELDS}
    }
  }
`;

export const CART_LINES_UPDATE_MUTATION = `
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { ${CART_FIELDS} }
      ${USER_ERROR_FIELDS}
    }
  }
`;

export const CART_LINES_REMOVE_MUTATION = `
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { ${CART_FIELDS} }
      ${USER_ERROR_FIELDS}
    }
  }
`;
