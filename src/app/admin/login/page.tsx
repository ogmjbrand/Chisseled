import Image from "next/image";
import { redirect } from "next/navigation";
import { isDatabaseConfigured } from "@/lib/db";
import { getStaff } from "@/lib/auth/staff";
import { LoginForm } from "@/app/admin/login/LoginForm";

export const metadata = { title: "Sign in" };

export default async function AdminLogin() {
  if (isDatabaseConfigured() && (await getStaff())) redirect("/admin");
  return (
    <div className="adm-root grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-[24rem]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image src="/media/brand/ch-shield.webp" alt="" width={34} height={34} className="h-[34px] w-auto" />
          <span className="font-display text-[1.125rem] font-bold uppercase tracking-tight text-bone">Chisseled Admin</span>
        </div>
        <div className="adm-card p-7">
          <h1 className="mb-1 text-[1rem] font-medium text-bone">Sign in to the console</h1>
          <p className="mb-6 text-[0.8125rem] text-smoke">Staff accounts only. Every sign-in is logged.</p>
          {isDatabaseConfigured() ? <LoginForm /> : <p className="adm-msg adm-msg-error">The database isn&apos;t configured yet.</p>}
        </div>
      </div>
    </div>
  );
}
