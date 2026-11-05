"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useKeepForm } from "@/components/admin/useKeepForm";
import type { ActionState } from "@/lib/security/validate";

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

/** Storefront-styled server-action form: keeps input on error, shows the result inline. */
export function StoreForm({
  action,
  children,
  submit,
  className = "space-y-4",
  resetOnSuccess = false,
  replaceOnSuccess = false,
  variant = "primary",
  confirm,
}: {
  action: Action;
  children?: ReactNode;
  submit: string;
  className?: string;
  resetOnSuccess?: boolean;
  /** Show only the success message once done (e.g. "check your email"). */
  replaceOnSuccess?: boolean;
  variant?: "primary" | "ghost";
  confirm?: string;
}) {
  const [state, formAction, actionPending] = useActionState<ActionState, FormData>(action, { ok: true });
  const keep = useKeepForm(formAction, { confirm });
  const ref = useRef<HTMLFormElement>(null);
  const pending = actionPending || keep.pending;
  useEffect(() => {
    if (resetOnSuccess && state.ok && state.message) ref.current?.reset();
  }, [state, resetOnSuccess]);

  if (replaceOnSuccess && state.ok && state.message) {
    return <p role="status" className="border border-purple/30 bg-purple/10 px-5 py-4 text-body-sm text-purple-bright">{state.message}</p>;
  }
  return (
    <form ref={ref} action={formAction} onSubmit={keep.onSubmit} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="text-body-sm" style={{ color: "var(--color-signal-alert)" }}>
          {state.error}
        </p>
      )}
      {state.ok && state.message && !replaceOnSuccess && <p role="status" className="text-body-sm text-purple-bright">{state.message}</p>}
      <button type="submit" disabled={pending} className={`btn ${variant === "primary" ? "btn-primary" : "btn-ghost btn-sm"} disabled:opacity-60`}>
        {pending ? "One moment…" : submit}
      </button>
    </form>
  );
}

export function StoreField({
  name,
  label,
  type = "text",
  defaultValue,
  required = true,
  autoComplete,
  minLength,
  className = "",
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  autoComplete?: string;
  minLength?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={`f-${name}`} className="eyebrow mb-2 block">
        {label}
        {!required && <span className="ml-1 normal-case tracking-normal text-ash">(optional)</span>}
      </label>
      <input id={`f-${name}`} name={name} type={type} defaultValue={defaultValue} required={required} autoComplete={autoComplete} minLength={minLength} className="field" />
    </div>
  );
}
