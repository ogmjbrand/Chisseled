"use client";

import { useActionState } from "react";
import { staffLoginAction } from "@/lib/auth/staff-actions";
import type { ActionState } from "@/lib/security/validate";
import { useKeepForm } from "@/components/admin/useKeepForm";

export function LoginForm() {
  const [state, action, actionPending] = useActionState<ActionState, FormData>(staffLoginAction, { ok: true });
  const { onSubmit, pending: submitting } = useKeepForm(action);
  const pending = actionPending || submitting;
  return (
    <form action={action} onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="adm-label mb-1.5 block">Email</span>
        <input name="email" type="email" autoComplete="username" required className="adm-input" />
      </label>
      <label className="block">
        <span className="adm-label mb-1.5 block">Password</span>
        <input name="password" type="password" autoComplete="current-password" required className="adm-input" />
      </label>
      {state.error && <p role="alert" className="adm-msg adm-msg-error">{state.error}</p>}
      <button disabled={pending} className="adm-btn adm-btn-primary w-full">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
