import { isDatabaseConfigured, db } from "@/lib/db";
import { requireStaff } from "@/lib/auth/staff";
import { staffLogoutAction } from "@/lib/auth/staff-actions";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return (
      <div className="adm-root grid place-items-center p-8">
        <div className="adm-card max-w-lg p-8">
          <h1 className="mb-2 text-bone">Database not connected</h1>
          <p className="text-smoke">Set DATABASE_URL and run <code>npm run db:migrate</code>, then create an owner with <code>npm run admin:create-owner</code>.</p>
        </div>
      </div>
    );
  }
  const staff = await requireStaff();
  const [{ unread }] = await db()<{ unread: number }[]>`select count(*)::int as unread from notifications where read_at is null`;
  return (
    <AdminShell
      allowed={[...staff.permissions]}
      staff={{ name: staff.name, email: staff.email, role: staff.roleName }}
      unread={staff.permissions.has("notifications:read") ? unread : 0}
      signOut={staffLogoutAction}
    >
      {children}
    </AdminShell>
  );
}
