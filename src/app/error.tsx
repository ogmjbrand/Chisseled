"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowMark } from "@/components/primitives/Marks";

/**
 * Root error boundary. Catches anything an async Server Component throws
 * (a Shopify fetch failure that isn't already handled gracefully upstream,
 * for instance) so a customer sees this instead of Next's default error
 * page. Deliberately doesn't surface `error.message` — that's for the
 * console, not the storefront.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70svh] flex-col items-center justify-center bg-ink px-6 text-center">
      <p className="eyebrow mb-6 text-purple-bright">Something went wrong</p>
      <h1 className="display-md mb-5 max-w-[20ch] text-bone">
        That didn&apos;t load right.
      </h1>
      <p className="lede mb-10 max-w-[42ch]">
        The store may be momentarily unreachable. Try again, or head back to browsing.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={() => reset()} className="btn btn-primary">
          Try again
          <ArrowMark className="size-4" />
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to home
        </Link>
      </div>
    </div>
  );
}
