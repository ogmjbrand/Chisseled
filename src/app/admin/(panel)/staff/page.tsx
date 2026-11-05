import Link from "next/link";
import { db } from "@/lib/db";
import { guard } from "@/lib/admin/guard";
import { can } from "@/lib/auth/staff";
import { Badge, Card, Field, Forbidden, PageHeader, Table, fmtDate } from "@/components/admin/ui";
import { ActionForm, Submit } from "@/components/admin/ActionForm";
import { deleteRoleAction, inviteStaffAction, resetStaffPasswordAction, saveRoleAction, updateStaffAction } from "@/lib/admin/staff-actions";

export const metadata = { title: "Staff & permissions" };

export default async function Staff() {
  const staff = await guard("staff:read");
  if (!staff) return <Forbidden />;
  const [members, roles, perms, grants] = await Promise.all([
    db()<{ id: string; name: string; email: string; status: string; role_id: string; role: string; role_key: string; last_login_at: Date | null; locked_until: Date | null }[]>`
      select u.id, u.name, u.email, u.status, u.role_id, r.name as role, r.key as role_key, u.last_login_at, u.locked_until
      from staff_users u join roles r on r.id = u.role_id order by u.created_at`,
    db()<{ id: string; key: string; name: string; description: string; is_system: boolean; members: number }[]>`
      select r.id, r.key, r.name, r.description, r.is_system, (select count(*)::int from staff_users where role_id = r.id) as members
      from roles r order by r.is_system desc, r.created_at`,
    db()<{ key: string; module: string; description: string }[]>`select key, module, description from permissions order by module, key`,
    db()<{ role_id: string; permission_key: string }[]>`select role_id, permission_key from role_permissions`,
  ]);
  const writable = can(staff, "staff:write");
  const granted = (roleId: string, key: string) => grants.some((g) => g.role_id === roleId && g.permission_key === key);
  const modules = [...new Set(perms.map((p) => p.module))];
  const assignable = roles.filter((r) => r.key !== "owner" || staff.roleKey === "owner");

  return (
    <>
      <PageHeader
        title="Staff & permissions"
        description="Every admin page and action checks permissions on the server. Sign-ins, failed attempts and every change are written to the audit log."
        actions={can(staff, "audit:read") && <Link href="/admin/staff/audit" className="adm-btn adm-btn-ghost">Audit log</Link>}
      />
      <div className="space-y-6">
        <Card title={`Team (${members.length})`} pad={false}>
          <Table head={["Member", "Role", "Status", "Last sign-in", writable ? "Manage" : ""]}>
            {members.map((m) => (
              <tr key={m.id}>
                <td><span className="block text-bone">{m.name}{m.id === staff.id && <span className="text-smoke"> (you)</span>}</span><span className="text-[0.75rem] text-smoke">{m.email}</span></td>
                <td>{m.role}</td>
                <td>{m.locked_until && m.locked_until > new Date() ? <Badge value="warning" label="locked" /> : <Badge value={m.status} />}</td>
                <td>{fmtDate(m.last_login_at, true)}</td>
                <td>
                  {writable && (m.role_key !== "owner" || staff.roleKey === "owner") && (
                    <details>
                      <summary className="cursor-pointer text-[0.75rem] text-purple-bright">Edit</summary>
                      <div className="mt-3 w-[22rem] max-w-full space-y-3">
                        <ActionForm action={updateStaffAction} className="space-y-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input name="name" defaultValue={m.name} aria-label="Name" className="adm-input adm-input-sm" />
                          <div className="flex gap-2">
                            <select name="role_id" defaultValue={m.role_id} aria-label="Role" className="adm-input adm-input-sm">{assignable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
                            <select name="status" defaultValue={m.status} aria-label="Status" className="adm-input adm-input-sm"><option value="active">Active</option><option value="suspended">Suspended</option></select>
                          </div>
                          <Submit variant="ghost" className="!py-1">Save</Submit>
                        </ActionForm>
                        <ActionForm action={resetStaffPasswordAction} resetOnSuccess className="flex gap-2">
                          <input type="hidden" name="id" value={m.id} />
                          <input name="password" type="password" autoComplete="new-password" minLength={12} required placeholder="New temporary password" aria-label="New password" className="adm-input adm-input-sm" />
                          <Submit variant="ghost" className="!py-1">Reset</Submit>
                        </ActionForm>
                      </div>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </Card>

        {writable && (
          <Card title="Add staff member">
            <ActionForm action={inviteStaffAction} resetOnSuccess className="grid gap-3 sm:grid-cols-4 sm:items-end">
              <Field label="Name"><input name="name" required className="adm-input" /></Field>
              <Field label="Email"><input name="email" type="email" required className="adm-input" /></Field>
              <Field label="Role"><select name="role_id" required className="adm-input">{assignable.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
              <Field label="Temporary password" hint="12+ characters with a number."><input name="password" type="password" autoComplete="new-password" minLength={12} required className="adm-input" /></Field>
              <div><Submit>Create account</Submit></div>
            </ActionForm>
          </Card>
        )}

        <Card title="Roles & permissions" pad={false}>
          <ul className="divide-y divide-bone/[0.07]">
            {roles.map((r) => (
              <li key={r.id} className="px-5 py-4">
                <details>
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span><span className="text-bone">{r.name}</span><span className="ml-2 text-[0.75rem] text-smoke">{r.description}</span></span>
                    <span className="text-[0.75rem] text-smoke">{r.members} member{r.members === 1 ? "" : "s"} · {grants.filter((g) => g.role_id === r.id).length} permissions</span>
                  </summary>
                  <fieldset disabled={!writable || r.key === "owner" || (r.key === "admin" && staff.roleKey !== "owner")} className="mt-4">
                    <ActionForm action={saveRoleAction} className="space-y-4">
                      <input type="hidden" name="id" value={r.id} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input name="name" defaultValue={r.name} aria-label="Role name" className="adm-input adm-input-sm" />
                        <input name="description" defaultValue={r.description} aria-label="Description" className="adm-input adm-input-sm" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {modules.map((mod) => (
                          <div key={mod}>
                            <p className="adm-label mb-1.5">{mod}</p>
                            {perms.filter((p) => p.module === mod).map((p) => (
                              <label key={p.key} className="flex items-start gap-2 py-0.5 text-[0.75rem]">
                                <input type="checkbox" name="permissions" value={p.key} defaultChecked={granted(r.id, p.key)} className="mt-0.5 accent-[var(--color-purple)]" />
                                <span>{p.description}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                      </div>
                      {r.key === "owner" ? <p className="text-[0.75rem] text-smoke">The owner role always has every permission.</p> : writable && <Submit variant="ghost">Save role</Submit>}
                    </ActionForm>
                    {writable && !r.is_system && (
                      <ActionForm action={deleteRoleAction} confirm="Delete this role?" className="mt-2"><input type="hidden" name="id" value={r.id} /><Submit variant="danger">Delete role</Submit></ActionForm>
                    )}
                  </fieldset>
                </details>
              </li>
            ))}
          </ul>
          {writable && (
            <div className="border-t border-bone/[0.07] px-5 py-4">
              <ActionForm action={saveRoleAction} resetOnSuccess className="flex flex-wrap items-end gap-2">
                <Field label="New custom role"><input name="name" required placeholder="e.g. Warehouse lead" className="adm-input" /></Field>
                <Submit variant="ghost">Create role</Submit>
                <span className="text-[0.75rem] text-smoke">Then expand it above to choose permissions.</span>
              </ActionForm>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
