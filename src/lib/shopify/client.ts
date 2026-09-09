import type { ShopifyResult } from "@/lib/shopify/types";

/**
 * SERVER-ONLY. No `"use client"` directive anywhere in this module, and it is
 * only ever imported from Server Components / Server Actions (never from a
 * "use client" file) — that keeps it out of the client bundle entirely. The
 * `typeof window` guard below is a second, dependency-free line of defence:
 * this project holds to zero runtime dependencies beyond next/react/react-dom
 * (see package.json), so this skips the `server-only` package in favour of
 * the same one-line check it wraps.
 *
 * The Storefront token is not printed, logged, or echoed anywhere in this
 * module or its callers — every error path below reports the HTTP status and
 * a message, never headers or env values.
 */
if (typeof window !== "undefined") {
  throw new Error("src/lib/shopify/client.ts must never be imported into client code.");
}

const API_VERSION = "2025-10";

function endpoint(): string {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!domain) throw new ShopifyConfigError("SHOPIFY_STORE_DOMAIN is not set");
  return `https://${domain}/api/${API_VERSION}/graphql.json`;
}

function token(): string {
  const t = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  if (!t) throw new ShopifyConfigError("SHOPIFY_STOREFRONT_ACCESS_TOKEN is not set");
  return t;
}

export class ShopifyConfigError extends Error {}

interface FetchOptions {
  query: string;
  variables?: Record<string, unknown>;
  /** Next.js fetch cache tags — omit for mutations, which must never cache. */
  tags?: string[];
  /** Seconds. Omit (or 0) to disable caching, e.g. for cart operations. */
  revalidate?: number;
}

/**
 * The single choke point for every Storefront API call. Never throws for a
 * network failure, a non-200 response, or a GraphQL-level error — those are
 * exactly the conditions this project's product/collection/cart pages must
 * degrade gracefully from, so they come back as a typed result instead.
 *
 * It DOES throw for a missing env var (SHOPIFY_STORE_DOMAIN /
 * SHOPIFY_STOREFRONT_ACCESS_TOKEN) — that is a deployment misconfiguration,
 * not a runtime condition a product page should silently paper over.
 */
export async function shopifyFetch<T>({
  query,
  variables,
  tags,
  revalidate,
}: FetchOptions): Promise<ShopifyResult<T>> {
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Shopify-Storefront-Access-Token": token(),
      },
      body: JSON.stringify({ query, variables }),
      ...(revalidate ? { next: { revalidate, tags } } : { cache: "no-store" as const }),
    });

    if (!res.ok) {
      return {
        data: null,
        networkError: false,
        errors: [`Shopify Storefront API responded ${res.status} ${res.statusText}`],
      };
    }

    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

    if (json.errors?.length) {
      return { data: json.data ?? null, networkError: false, errors: json.errors.map((e) => e.message) };
    }

    return { data: json.data ?? null, networkError: false };
  } catch (err) {
    if (err instanceof ShopifyConfigError) throw err;
    // Network failure, DNS failure, egress block, timeout — the store is
    // simply unreachable right now. Every caller falls back to local data.
    const message = err instanceof Error ? err.message : "Unknown network error";
    return { data: null, networkError: true, errors: [message] };
  }
}
