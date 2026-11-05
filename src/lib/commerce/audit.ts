import { db, type Queryable } from "@/lib/db";
import type { StaffUser } from "@/lib/auth/staff";
import { clientIp } from "@/lib/security/request";

/** Writes one audit log row. Every admin mutation calls this. */
export async function audit(
  staff: StaffUser | null,
  action: string,
  entityType: string,
  entityId: string,
  changes: Record<string, unknown> = {},
  q: Queryable = db(),
): Promise<void> {
  let ip: string | null = null;
  try {
    ip = await clientIp();
  } catch {
    ip = null; // outside a request (scripts, webhooks without headers)
  }
  await q`
    insert into audit_logs (staff_id, actor, action, entity_type, entity_id, changes, ip)
    values (${staff?.id ?? null}, ${staff?.email ?? "system"}, ${action}, ${entityType}, ${entityId},
            ${q.json(changes as never)}, ${ip})`;
}

export async function notify(
  input: {
    kind: string;
    title: string;
    body?: string;
    severity?: "info" | "warning" | "critical";
    entityType?: string;
    entityId?: string;
    /** Same key twice is ignored — e.g. one low-stock alert per variant until read. */
    dedupeKey?: string;
  },
  q: Queryable = db(),
): Promise<void> {
  await q`
    insert into notifications (kind, title, body, severity, entity_type, entity_id, dedupe_key)
    values (${input.kind}, ${input.title}, ${input.body ?? ""}, ${input.severity ?? "info"},
            ${input.entityType ?? null}, ${input.entityId ?? null}, ${input.dedupeKey ?? null})
    on conflict (dedupe_key) do nothing`;
}
