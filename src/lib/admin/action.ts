import { revalidatePath } from "next/cache";
import { ForbiddenError, requirePermission, type StaffUser } from "@/lib/auth/staff";
import type { Permission } from "@/lib/auth/permissions";
import { rateLimit } from "@/lib/security/rate-limit";
import { toActionError, type ActionState } from "@/lib/security/validate";

/**
 * Wraps every admin mutation: server-side permission check, a per-staff
 * write rate limit, error → form state conversion, and cache revalidation
 * so the storefront reflects the change on the next request.
 */
export function adminAction(
  permission: Permission,
  fn: (staff: StaffUser, form: FormData) => Promise<string | void>,
  opts: { revalidate?: string[] } = {},
) {
  return async (_prev: ActionState, form: FormData): Promise<ActionState> => {
    try {
      const staff = await requirePermission(permission);
      const limit = await rateLimit(`admin-write:${staff.id}`, 120, 60);
      if (!limit.ok) return { ok: false, error: "Too many changes in a short time. Wait a moment." };
      const message = await fn(staff, form);
      for (const p of opts.revalidate ?? ["/", "/admin"]) revalidatePath(p, "layout");
      return { ok: true, message: message || "Saved." };
    } catch (err) {
      if (err instanceof ForbiddenError) return { ok: false, error: err.message };
      return toActionError(err);
    }
  };
}
