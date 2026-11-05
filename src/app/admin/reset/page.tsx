import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { staffResetAction } from "@/lib/auth/account-actions";

export const metadata = { title: "Choose a new password" };

export default async function AdminReset({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return (
    <AuthCard title="Choose a new password" subtitle="12+ characters with letters and a number. All your sessions will be signed out.">
      <ActionForm action={staffResetAction} className="space-y-4">
        <input type="hidden" name="token" value={token.slice(0, 100)} />
        <label className="block"><span className="adm-label mb-1.5 block">New password</span><input name="password" type="password" minLength={12} required autoComplete="new-password" className="adm-input" /></label>
        <Submit className="w-full">Save password</Submit>
      </ActionForm>
      <p className="mt-5 text-[0.75rem] text-smoke"><Link href="/admin/login" className="text-purple-bright">Go to sign in</Link></p>
    </AuthCard>
  );
}
