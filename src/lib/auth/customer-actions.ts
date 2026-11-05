"use server";

import { redirect } from "next/navigation";
import { loginCustomer, logoutCustomer, registerCustomer } from "@/lib/auth/customer";
import { bool, email, optStr, str, toActionError, type ActionState } from "@/lib/security/validate";

function safeNext(form: FormData): string {
  const next = optStr(form, "next", { max: 200 });
  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function customerSignInAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await loginCustomer(email(form), str(form, "password", { max: 200, label: "Password" }));
  } catch (err) {
    return toActionError(err);
  }
  redirect(safeNext(form));
}

export async function customerRegisterAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await registerCustomer({
      email: email(form),
      password: str(form, "password", { max: 200, label: "Password" }),
      firstName: str(form, "firstName", { max: 80, label: "First name" }),
      lastName: optStr(form, "lastName", { max: 80 }),
      acceptsMarketing: bool(form, "acceptsMarketing"),
    });
  } catch (err) {
    return toActionError(err);
  }
  redirect(safeNext(form));
}

export async function customerSignOutAction(): Promise<void> {
  await logoutCustomer();
  redirect("/account");
}
