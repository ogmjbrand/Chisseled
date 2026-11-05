import Image from "next/image";
import type { ReactNode } from "react";

export function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="adm-root grid min-h-svh place-items-center px-4">
      <div className="w-full max-w-[24rem]">
        <div className="mb-8 flex items-center justify-center gap-3">
          <Image src="/media/brand/ch-shield.webp" alt="" width={34} height={34} className="h-[34px] w-auto" />
          <span className="font-display text-[1.125rem] font-bold uppercase tracking-tight text-bone">Chisseled Admin</span>
        </div>
        <div className="adm-card p-7">
          <h1 className="mb-1 text-[1rem] font-medium text-bone">{title}</h1>
          <p className="mb-6 text-[0.8125rem] text-smoke">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
