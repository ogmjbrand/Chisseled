import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");

function getEnv(name) {
  const line = env
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith(`${name}=`));

  if (!line) return undefined;

  return line
    .slice(name.length + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
}

const domain = getEnv("SHOPIFY_STORE_DOMAIN");
const token = getEnv("SHOPIFY_STOREFRONT_ACCESS_TOKEN");

if (!domain || !token) {
  console.error("Missing Shopify environment variables in .env.local");
  process.exit(1);
}

const query = `
query {
  product(handle: "women-cropped-fitness-casual-sweatshirts") {
    id
    handle
    title
    description
    descriptionHtml
    availableForSale
    tags
    featuredImage {
      url
      altText
    }
    images(first: 10) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
    }
    options {
      name
      values
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
      maxVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          quantityAvailable
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
}
`;

const response = await fetch(
  `https://${domain}/api/2025-10/graphql.json`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query }),
  },
);

const json = await response.json();

console.log(JSON.stringify(json, null, 2));
