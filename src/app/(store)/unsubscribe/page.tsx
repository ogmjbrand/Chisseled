import { UnsubscribeForm } from "@/components/account/UnsubscribeForm";

export const metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

/**
 * One-click unsubscribe. The link shows a button rather than unsubscribing on
 * GET, so link scanners in mail clients can't unsubscribe people by accident.
 */
export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow mb-5">Email preferences</p>
      <h1 className="display-md mb-4 text-bone">Unsubscribe from CHISSELED email.</h1>
      <p className="mb-8 max-w-[44ch] text-body-sm text-smoke">
        You&apos;ll still get emails about orders you place — receipts and shipping updates.
      </p>
      <UnsubscribeForm token={token.slice(0, 64)} />
    </div>
  );
}
