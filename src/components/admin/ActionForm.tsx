"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/security/validate";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

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
  const [state, formAction] = useActionState<ActionState, FormData>(action, { ok: true });
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok && state.message && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      id={id}
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <FormMessage state={state} />
    </form>
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
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} className={`adm-btn adm-btn-${variant} ${className}`}>
      {pending ? "Working…" : children}
    </button>
  );
}
