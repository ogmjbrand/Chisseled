"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/lib/security/validate";
import { useKeepForm } from "@/components/admin/useKeepForm";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const Pending = createContext(false);

/** A form bound to an admin server action, with inline success / error feedback. */
export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
  id,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  /** Native confirm() before submitting — for destructive actions. */
  confirm?: string;
  id?: string;
}) {
  const [state, formAction, actionPending] = useActionState<ActionState, FormData>(action, { ok: true });
  const { onSubmit, pending } = useKeepForm(formAction, { confirm });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && state.message && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <Pending.Provider value={pending || actionPending}>
      <form id={id} ref={ref} action={formAction} onSubmit={onSubmit} className={className}>
        {children}
        <FormMessage state={state} />
      </form>
    </Pending.Provider>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="adm-msg adm-msg-error mt-3">
        {state.error}
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p role="status" className="adm-msg adm-msg-ok mt-3">
        {state.message}
      </p>
    );
  }
  return null;
}

export function Submit({
  children,
  variant = "primary",
  className = "",
  name,
  value,
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  name?: string;
  value?: string;
}) {
  const pending = useContext(Pending);
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`adm-btn adm-btn-${variant} ${className}`}>
      {pending ? "Working…" : children}
    </button>
  );
}
