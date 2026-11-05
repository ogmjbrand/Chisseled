"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NAV } from "@/components/admin/nav";

export function AdminShell({
  allowed,
  staff,
  unread,
  signOut,
  children,
}: {
  allowed: string[];
  staff: { name: string; email: string; role: string };
  unread: number;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  const items = NAV.filter((n) => allowed.includes(n.permission));
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav className="adm-nav space-y-0.5" aria-label="Admin">
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={n.icon} />
          </svg>
          <span className="flex-1">{n.label}</span>
          {n.href === "/admin/notifications" && unread > 0 && (
            <span className="numeric rounded-full bg-purple px-1.5 text-[0.625rem] leading-[1.1rem] text-white">{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="adm-root lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Desktop sidebar */}
      <aside className="adm-no-print sticky top-0 hidden h-svh flex-col border-r border-bone/[0.07] bg-[#0e0e12] px-3 py-5 lg:flex">
        <Link href="/admin" className="mb-7 flex items-center gap-2.5 px-2">
          <Image src="/media/brand/ch-shield.webp" alt="" width={26} height={26} className="h-[26px] w-auto" />
          <span className="font-display text-[0.9375rem] font-bold uppercase tracking-tight text-bone">Chisseled</span>
          <span className="rounded bg-purple/20 px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-purple-bright">Admin</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 border-t border-bone/[0.07] px-2 pt-4">
          <p className="truncate text-[0.8125rem] text-bone">{staff.name}</p>
          <p className="truncate text-[0.6875rem] text-smoke">{staff.role}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/" className="adm-btn adm-btn-ghost flex-1 !px-2 !py-1.5 !text-[0.75rem]" target="_blank">View store</Link>
            <form action={signOut} className="flex-1">
              <button className="adm-btn adm-btn-ghost w-full !px-2 !py-1.5 !text-[0.75rem]">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="adm-no-print sticky top-0 z-30 flex items-center justify-between border-b border-bone/[0.07] bg-[#0e0e12]/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/media/brand/ch-shield.webp" alt="" width={22} height={22} className="h-[22px] w-auto" />
          <span className="font-display text-[0.875rem] font-bold uppercase text-bone">Admin</span>
        </Link>
        <button
          type="button"
          className="adm-btn adm-btn-ghost !px-3"
          aria-expanded={open}
          aria-controls="adm-mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
          {unread > 0 && <span className="numeric rounded-full bg-purple px-1.5 text-[0.625rem] text-white">{unread}</span>}
        </button>
      </div>
      {open && (
        <div id="adm-mobile-nav" className="adm-no-print fixed inset-x-0 bottom-0 top-[53px] z-20 overflow-y-auto bg-[#0e0e12] p-4 lg:hidden">
          {nav}
          <div className="mt-6 flex gap-2 border-t border-bone/[0.07] pt-4">
            <Link href="/" className="adm-btn adm-btn-ghost flex-1">View store</Link>
            <form action={signOut} className="flex-1">
              <button className="adm-btn adm-btn-ghost w-full">Sign out</button>
            </form>
          </div>
        </div>
      )}

      <main id="main" className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-[84rem]">{children}</div>
      </main>
    </div>
  );
}
