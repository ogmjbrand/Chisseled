import { db } from "@/lib/db";
import { assertServer } from "@/lib/security/server-only";

assertServer("src/lib/security/rate-limit");

/**
 * Fixed-window rate limiter stored in Postgres, so it holds across
 * serverless instances. One atomic upsert per check.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number; retryAfter: number }> {
  const [row] = await db()<{ count: number; window_start: Date }[]>`
    insert into rate_limits (key, count, window_start)
    values (${key}, 1, now())
    on conflict (key) do update set
      count = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                   then 1 else rate_limits.count + 1 end,
      window_start = case when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
                   then now() else rate_limits.window_start end
    returning count, window_start`;
  const elapsed = (Date.now() - new Date(row.window_start).getTime()) / 1000;
  return {
    ok: row.count <= limit,
    remaining: Math.max(0, limit - row.count),
    retryAfter: Math.max(0, Math.ceil(windowSeconds - elapsed)),
  };
}
