"use client";

import { useActionState, useState } from "react";
import { stockAlertAction } from "@/lib/commerce/marketing-actions";
import { useKeepForm } from "@/components/admin/useKeepForm";
import type { ActionState } from "@/lib/security/validate";

/** Back-in-stock alert for sold-out sizes — stored server-side, emailed once when stock returns. */
export function BackInStock({ slug, colorway, soldOut }: { slug: string; colorway: string; soldOut: string[] }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(stockAlertAction, { ok: true });
  const keep = useKeepForm(action);

  if (state.ok && state.message) {
    return <p role="status" className="mt-3 text-micro text-purple-bright">{state.message}</p>;
  }
  if (!open) {
    return (
      <p className="mt-3 text-micro text-ash">
        Sold out in your size?{" "}
        <button type="button" onClick={() => setOpen(true)} className="link-rule text-smoke">
          Get a back-in-stock alert
        </button>
        .
      </p>
    );
  }
  return (
    <form action={action} onSubmit={keep.onSubmit} className="mt-3 space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="colorway" value={colorway} />
      <div className="flex flex-col gap-2 sm:flex-row">
        {soldOut.length > 0 && (
          <>
            <label htmlFor="bis-size" className="sr-only">Size</label>
            <select id="bis-size" name="size" className="field sm:w-28" defaultValue={soldOut[0]}>
              {soldOut.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}
        <label htmlFor="bis-email" className="sr-only">Email</label>
        <input id="bis-email" name="email" type="email" required autoComplete="email" placeholder="you@email.com" className="field flex-1" />
        <button type="submit" disabled={pending || keep.pending} className="btn btn-ghost btn-sm shrink-0 disabled:opacity-60">
          {pending || keep.pending ? "Saving…" : "Notify me"}
        </button>
      </div>
      {state.error && <p role="alert" className="text-micro" style={{ color: "var(--color-signal-alert)" }}>{state.error}</p>}
      <p className="text-micro text-ash">One email when it&apos;s back. Nothing else.</p>
    </form>
  );
}
