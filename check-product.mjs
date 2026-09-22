import fs from "node:fs";

const env = fs.readFileSync(".env.local", "utf8");

const domain = env.match(/^SHOPIFY_STORE_DOMAIN=(.*)$/m)?.[1]?.trim();
const token = env.match(/^SHOPIFY_STOREFRONT_ACCESS_TOKEN=(.*)$/m)?.[1]?.trim();

if (!domain || !token) {
  throw new Error("Shopify environment variables are missing.");
}

const query = `
query ProductByHandle($handle: String!) {
  product(handle: $handle) {
    id
    title
    handle
    availableForSale
    variants(first: 50) {
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
    body: JSON.stringify({
      query,
      variables: {
        handle: "scarred-hoodie",
      },
    }),
  }
);

const json = await response.json();

console.log(JSON.stringify(json, null, 2));