"use server";

import { redirect } from "next/navigation";
import { loginStaff, logoutStaff } from "@/lib/auth/staff";
import { email, str, toActionError, type ActionState } from "@/lib/security/validate";

export async function staffLoginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const result = await loginStaff(email(form), str(form, "password", { max: 200, label: "Password" }));
    if (!result.ok) return { ok: false, error: result.error };
  } catch (err) {
    return toActionError(err);
  }
  redirect("/admin");
}

export async function staffLogoutAction(): Promise<void> {
  await logoutStaff();
  redirect("/admin/login");
}
