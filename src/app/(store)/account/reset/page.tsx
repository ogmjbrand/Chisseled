import Link from "next/link";
import { StoreField, StoreForm } from "@/components/account/StoreForm";
import { customerResetAction } from "@/lib/auth/account-actions";

export const metadata = { title: "Choose a new password", robots: { index: false, follow: false } };

export default async function Reset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center py-24">
      <div className="mx-auto w-full max-w-[26rem]">
        <p className="eyebrow mb-5">Account</p>
        <h1 className="display-md mb-8 text-bone">Choose a new password.</h1>
        <StoreForm action={customerResetAction} submit="Save password" replaceOnSuccess>
          <input type="hidden" name="token" value={token.slice(0, 100)} />
          <StoreField name="password" label="New password (10+ characters, include a number)" type="password" autoComplete="new-password" minLength={10} />
        </StoreForm>
        <p className="mt-6 text-caption text-smoke"><Link href="/account" className="link-rule text-bone">Go to sign in</Link></p>
      </div>
    </div>
  );
}
