"use client";

import { useTransition, type FormEvent } from "react";

/**
 * React 19 resets a <form action={fn}> after every submission — fine on
 * success, destructive on a validation error (the user's input vanishes).
 * This submits the form's data through a transition instead, so fields keep
 * their values; callers reset explicitly on success when they want to.
 * The `action` prop stays on the form for no-JS progressive enhancement.
 */
export function useKeepForm(dispatch: (data: FormData) => void, opts: { confirm?: string } = {}) {
  const [pending, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (opts.confirm && !window.confirm(opts.confirm)) return;
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(e.currentTarget, submitter);
    start(() => dispatch(data));
  };
  return { onSubmit, pending };
}
