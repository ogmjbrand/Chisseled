"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/nav";
import { useStore } from "@/lib/store";
import { useEscape, useScrolled, useScrollLock } from "@/lib/motion";
import { Sculpture } from "@/components/primitives/Visual";
import {
  AccountMark,
  ArrowMark,
  BagMark,
  ChevronMark,
  CloseMark,
  MenuMark,
  Monogram,
  SearchMark,
  WishMark,
} from "@/components/primitives/Marks";

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrolled(40);
  const { count, setCartOpen, setSearchOpen, wishlist } = useStore();

  const [openSection, setOpenSection] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // The hero is transparent-over-media; every other route needs a solid bar.
  const overMedia = pathname === "/";

  const closeAll = useCallback(() => {
    setOpenSection(null);
    setMobileOpen(false);
  }, []);

  useEscape(Boolean(openSection) || mobileOpen, closeAll);
  useScrollLock(mobileOpen);

  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  // A short grace period stops the menu snapping shut as the pointer
  // crosses the gap between the trigger and the panel.
  const openWithGrace = (label: string) => {
    window.clearTimeout(closeTimer.current);
    setOpenSection(label);
  };

  const closeWithGrace = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenSection(null), 140);
  };

  const solid = scrolled || !overMedia || Boolean(openSection);

  return (
    <>
      <a href="#main" className="sr-only-focusable btn btn-primary fixed left-4 top-4 z-[100]">
        Skip to content
      </a>

      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500",
          solid
            ? "border-b border-bone/10 bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        ].join(" ")}
        onMouseLeave={closeWithGrace}
      >
        <div className="shell flex h-[var(--nav-h)] items-center justify-between gap-6">
          {/* --- Mobile menu trigger --- */}
          <button
            type="button"
            className="-ml-2 p-2 lg:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
          >
            <MenuMark className="size-6" />
          </button>

          {/* --- Wordmark --- */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 lg:flex-none"
            aria-label="CHISSELED — home"
          >
            <Monogram className="size-6 text-bone transition-colors duration-500 group-hover:text-purple-bright" />
            <span className="font-display text-[1.0625rem] font-black uppercase leading-none tracking-[0.3em] text-bone">
              Chisseled
            </span>
          </Link>

          {/* --- Primary navigation --- */}
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((section) => {
                const active = openSection === section.label;
                return (
                  <li key={section.label}>
                    <Link
                      href={section.href}
                      className="relative block px-4 py-6 font-mono text-label font-medium uppercase tracking-[0.2em] text-fog transition-colors duration-300 hover:text-bone"
                      onMouseEnter={() => openWithGrace(section.label)}
                      onFocus={() => openWithGrace(section.label)}
                      aria-expanded={active}
                      aria-haspopup="true"
                    >
                      {section.label}
                      <span
                        aria-hidden
                        className={[
                          "absolute inset-x-4 bottom-4 h-px origin-left bg-purple-bright transition-transform duration-500 ease-[var(--ease-out-expo)]",
                          active ? "scale-x-100" : "scale-x-0",
                        ].join(" ")}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* --- Utilities --- */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2.5 text-fog transition-colors duration-300 hover:text-bone"
              aria-label="Search"
            >
              <SearchMark className="size-5" />
            </button>

            <Link
              href="/account"
              className="hidden p-2.5 text-fog transition-colors duration-300 hover:text-bone sm:block"
              aria-label="Account"
            >
              <AccountMark className="size-5" />
            </Link>

            <Link
              href="/wishlist"
              className="relative hidden p-2.5 text-fog transition-colors duration-300 hover:text-bone sm:block"
              aria-label={`Wishlist, ${wishlist.length} saved`}
            >
              <WishMark className="size-5" />
              {wishlist.length > 0 && (
                <span className="absolute right-1 top-1 size-1.5 rounded-full bg-purple-bright" />
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative -mr-2 flex items-center gap-2 p-2.5 text-bone"
              aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
            >
              <BagMark className="size-5" />
              <span
                className={[
                  "numeric min-w-4 text-caption tabular-nums transition-all duration-300",
                  count > 0 ? "text-purple-bright opacity-100" : "text-ash opacity-60",
                ].join(" ")}
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {/* --- Mega menu --- */}
        {NAV.map((section) => (
          <MegaPanel
            key={section.label}
            section={section}
            open={openSection === section.label}
            onEnter={() => openWithGrace(section.label)}
            onLeave={closeWithGrace}
          />
        ))}
      </header>

      {mobileOpen && <MobileNav onClose={() => setMobileOpen(false)} />}
    </>
  );
}

/* ==================================================================
   MEGA PANEL
   ================================================================== */

function MegaPanel({
  section,
  open,
  onEnter,
  onLeave,
}: {
  section: (typeof NAV)[number];
  open: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  return (
    <div
      className={[
        "absolute inset-x-0 top-full hidden overflow-hidden border-b border-bone/10 bg-ink/97 backdrop-blur-2xl transition-[max-height,opacity] duration-[600ms] ease-[var(--ease-out-expo)] lg:block",
        open ? "max-h-[34rem] opacity-100" : "pointer-events-none max-h-0 opacity-0",
      ].join(" ")}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      // Hidden from assistive tech when closed; the top-level links still work.
      aria-hidden={!open}
      inert={!open}
    >
      <div className="shell grid grid-cols-12 gap-x-10 py-12">
        <div className="col-span-7 grid grid-cols-3 gap-x-8">
          {section.columns.map((col) => (
            <div key={col.title}>
              <h2 className="eyebrow mb-6">{col.title}</h2>
              <ul className="space-y-3.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="group flex items-baseline gap-2 text-body-sm text-fog transition-colors duration-300 hover:text-bone"
                    >
                      <span className="link-rule">{link.label}</span>
                      {link.note && (
                        <span className="font-mono text-micro uppercase tracking-[0.14em] text-purple-bright">
                          {link.note}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Editorial anchor — a mega menu should still sell something. */}
        <Link
          href={section.feature.href}
          className="group relative col-span-5 grain vignette overflow-hidden"
        >
          <Sculpture
            seed={section.feature.seed}
            tone={section.feature.tone}
            pose={section.feature.pose}
            anchor={0.68}
            scale={0.72}
            className="absolute inset-0 size-full transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
          <div className="relative z-[3] flex h-full max-w-[24rem] flex-col justify-end p-8">
            <p className="eyebrow mb-3 text-purple-bright">{section.feature.eyebrow}</p>
            <h3 className="display-sm mb-3 text-bone">{section.feature.title}</h3>
            <p className="mb-5 text-body-sm leading-relaxed text-fog">{section.feature.body}</p>
            <span className="inline-flex items-center gap-2 font-mono text-label uppercase tracking-[0.18em] text-bone">
              {section.feature.cta}
              <ArrowMark className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1.5" />
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

/* ==================================================================
   MOBILE NAVIGATION
   Full-screen, accordion, thumb-reachable.
   ================================================================== */

function MobileNav({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(NAV[0].label);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink lg:hidden animate-fade">
      <div className="flex h-[var(--nav-h)] shrink-0 items-center justify-between border-b border-bone/10 px-[var(--gutter)]">
        <span className="font-display text-[1.0625rem] font-black uppercase tracking-[0.3em]">
          Chisseled
        </span>
        <button type="button" onClick={onClose} className="-mr-2 p-2" aria-label="Close menu">
          <CloseMark className="size-6" />
        </button>
      </div>

      <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-[var(--gutter)] py-6">
        <ul className="divide-y divide-bone/10">
          {NAV.map((section) => {
            const open = expanded === section.label;
            return (
              <li key={section.label}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-5 text-left"
                  onClick={() => setExpanded(open ? null : section.label)}
                  aria-expanded={open}
                >
                  <span className="display-sm text-bone">{section.label}</span>
                  <ChevronMark
                    className={[
                      "size-5 text-smoke transition-transform duration-500 ease-[var(--ease-out-expo)]",
                      open ? "rotate-90" : "",
                    ].join(" ")}
                  />
                </button>

                <div
                  className={[
                    "grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-out-expo)]",
                    open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-6 pb-6">
                      {section.columns.map((col) => (
                        <div key={col.title}>
                          <h3 className="eyebrow mb-3">{col.title}</h3>
                          <ul className="space-y-2.5">
                            {col.links.map((link) => (
                              <li key={link.href + link.label}>
                                <Link
                                  href={link.href}
                                  onClick={onClose}
                                  className="block py-1 text-body text-fog"
                                >
                                  {link.label}
                                  {link.note && (
                                    <span className="ml-2 font-mono text-micro uppercase tracking-[0.14em] text-purple-bright">
                                      {link.note}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Link href="/account" onClick={onClose} className="btn btn-ghost btn-sm justify-center">
            Account
          </Link>
          <Link href="/wishlist" onClick={onClose} className="btn btn-ghost btn-sm justify-center">
            Wishlist
          </Link>
        </div>

        <Link href="/fit" onClick={onClose} className="btn btn-purple btn-block mt-3">
          Find your fit
        </Link>
      </nav>
    </div>
  );
}
