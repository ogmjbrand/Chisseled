import Link from "next/link";
import { StoreField, StoreForm } from "@/components/account/StoreForm";
import { customerForgotAction } from "@/lib/auth/account-actions";

export const metadata = { title: "Reset your password", robots: { index: false, follow: false } };

export default function Forgot() {
  return (
    <div className="shell flex min-h-[70svh] flex-col justify-center py-24">
      <div className="mx-auto w-full max-w-[26rem]">
        <p className="eyebrow mb-5">Account</p>
        <h1 className="display-md mb-4 text-bone">Forgot your password?</h1>
        <p className="mb-8 text-body-sm text-smoke">
          Enter your email and we&apos;ll send a link to choose a new one. Checked out as a guest before? This sets up your account too.
        </p>
        <StoreForm action={customerForgotAction} submit="Send reset link" replaceOnSuccess>
          <StoreField name="email" label="Email" type="email" autoComplete="email" />
        </StoreForm>
        <p className="mt-6 text-caption text-smoke"><Link href="/account" className="link-rule text-bone">Back to sign in</Link></p>
      </div>
    </div>
  );
}
