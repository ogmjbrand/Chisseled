import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-block text-[0.75rem] text-smoke hover:text-bone">
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-[1.75rem] font-bold uppercase leading-none tracking-tight text-bone">{title}</h1>
        {description && <p className="mt-2 max-w-[70ch] text-[0.875rem] text-smoke">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, actions, children, className = "", pad = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={`adm-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-bone/[0.07] px-5 py-3.5">
          {title && <h2 className="adm-card-title">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, trend }: { label: string; value: ReactNode; hint?: ReactNode; trend?: number | null }) {
  return (
    <div className="adm-card p-5">
      <p className="adm-label">{label}</p>
      <p className="numeric mt-2 text-[1.625rem] font-medium leading-none text-bone">{value}</p>
      <div className="mt-2 flex items-center gap-2 text-[0.75rem] text-smoke">
        {trend !== undefined && trend !== null && Number.isFinite(trend) && (
          <span className={trend >= 0 ? "text-[#5fd39a]" : "text-[#ff7a7a]"}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        {hint}
      </div>
    </div>
  );
}

const TONE: Record<string, string> = {
  active: "ok", paid: "ok", succeeded: "ok", fulfilled: "ok", delivered: "ok", completed: "ok", open: "info",
  draft: "muted", archived: "muted", disabled: "muted", voided: "muted", abandoned: "muted", unfulfilled: "warn",
  pending: "warn", initialized: "warn", partially_fulfilled: "info", partially_refunded: "info", in_transit: "info",
  out_for_delivery: "info", scheduled: "info", refunded: "muted", returned: "muted", cancelled: "bad", failed: "bad",
  suspended: "bad", critical: "bad", warning: "warn", info: "info",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return <span className={`adm-badge adm-badge-${TONE[value] ?? "muted"}`}>{label ?? value.replace(/_/g, " ")}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-[0.9375rem] text-bone">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-[48ch] text-[0.8125rem] text-smoke">{children}</div>}
    </div>
  );
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="adm-table">
        <thead>
          <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

/** GET search/filter bar — URL is the state, so filtered views are linkable. */
export function Filters({ children, action }: { children: ReactNode; action: string }) {
  return (
    <form action={action} method="get" className="flex flex-wrap items-end gap-2 border-b border-bone/[0.07] px-5 py-3">
      {children}
      <button className="adm-btn adm-btn-ghost">Apply</button>
    </form>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <nav className="flex items-center justify-between border-t border-bone/[0.07] px-5 py-3 text-[0.8125rem] text-smoke" aria-label="Pagination">
      <span>Page {page} of {pages}</span>
      <span className="flex gap-2">
        {page > 1 && <Link className="adm-btn adm-btn-ghost" href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className="adm-btn adm-btn-ghost" href={href(page + 1)}>Next</Link>}
      </span>
    </nav>
  );
}

export function Field({ label, children, hint, className = "" }: { label: string; children: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="adm-label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[0.75rem] text-ash">{hint}</span>}
    </label>
  );
}

export function Forbidden() {
  return (
    <div className="adm-card p-10 text-center">
      <p className="text-bone">You don&apos;t have access to this area.</p>
      <p className="mt-2 text-[0.8125rem] text-smoke">Ask a store owner to adjust your role in Staff &amp; permissions.</p>
    </div>
  );
}

export function fmtDate(d: Date | string | null | undefined, withTime = false): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}
