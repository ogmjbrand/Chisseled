import Link from "next/link";
import { AuthCard } from "@/components/admin/AuthCard";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { staffForgotAction } from "@/lib/auth/account-actions";

export const metadata = { title: "Reset password" };

export default function AdminForgot() {
  return (
    <AuthCard title="Reset your password" subtitle="We'll email a one-time link to your staff address.">
      <ActionForm action={staffForgotAction} className="space-y-4">
        <label className="block"><span className="adm-label mb-1.5 block">Email</span><input name="email" type="email" required autoComplete="username" className="adm-input" /></label>
        <Submit className="w-full">Send reset link</Submit>
      </ActionForm>
      <p className="mt-5 text-[0.75rem] text-smoke"><Link href="/admin/login" className="text-purple-bright">Back to sign in</Link></p>
    </AuthCard>
  );
}
