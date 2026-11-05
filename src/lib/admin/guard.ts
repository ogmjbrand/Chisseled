import { can, requireStaff, type StaffUser } from "@/lib/auth/staff";
import type { Permission } from "@/lib/auth/permissions";

/** For admin pages: returns the staff member if permitted, else null (render <Forbidden/>). */
export async function guard(permission: Permission): Promise<StaffUser | null> {
  const staff = await requireStaff();
  return can(staff, permission) ? staff : null;
}

export function pageNumber(v: string | undefined): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function likePattern(q: string): string {
  return `%${q.replace(/[%_\\]/g, "\\$&")}%`;
}
