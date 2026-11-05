import postgres from "postgres";
import { assertServer } from "@/lib/security/server-only";

assertServer("src/lib/db");

/**
 * The one database connection for the app. Server-only: DATABASE_URL is a
 * privileged credential and never reaches the browser.
 *
 * On Supabase use the pooled connection string (port 6543, "transaction"
 * mode) for serverless deployments; `prepare: false` keeps that compatible.
 */
type Sql = postgres.Sql<Record<string, never>>;

declare global {
  var __chisseledSql: Sql | undefined;
}

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set — the commerce backend is not configured.");
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Sql {
  if (!process.env.DATABASE_URL) throw new DatabaseNotConfiguredError();
  if (!globalThis.__chisseledSql) {
    globalThis.__chisseledSql = postgres(process.env.DATABASE_URL, {
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
      onnotice: () => {},
      types: {
        // bigint (order numbers, identity ids) → JS number; values stay well under 2^53.
        bigint: { to: 20, from: [20], parse: (x: string) => Number(x), serialize: (x: number) => String(x) },
      },
      transform: { undefined: null },
    }) as unknown as Sql;
  }
  return globalThis.__chisseledSql;
}

export type Tx = postgres.TransactionSql<Record<string, never>>;
export type Queryable = Sql | Tx;

/** Runs `fn` in one transaction. Throwing rolls everything back. */
export async function transaction<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return (await db().begin((tx) => fn(tx as unknown as Tx))) as T;
}

/** Postgres error code helper (e.g. 23505 unique_violation, 23514 check_violation). */
export function pgCode(err: unknown): string | undefined {
  return typeof err === "object" && err && "code" in err ? String((err as { code: unknown }).code) : undefined;
}
