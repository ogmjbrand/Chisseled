"use client";

import { useActionState } from "react";
import { unsubscribeAction } from "@/lib/commerce/marketing-actions";
import type { ActionState } from "@/lib/security/validate";

export function UnsubscribeForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(unsubscribeAction, { ok: true });
  if (state.ok && state.message) return <p role="status" className="text-body-sm text-purple-bright">{state.message}</p>;
  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      <button disabled={pending || !token} className="btn btn-primary disabled:opacity-60">
        {pending ? "One moment…" : "Unsubscribe"}
      </button>
      {state.error && <p role="alert" className="mt-4 text-body-sm" style={{ color: "var(--color-signal-alert)" }}>{state.error}</p>}
    </form>
  );
}
