#!/usr/bin/env node
// Applies supabase/migrations/*.sql in filename order, once each, inside a
// transaction per file. Tracks applied files in public.schema_migrations.
//   DATABASE_URL=postgres://... node scripts/db-migrate.mjs
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { loadEnv } from "./lib/env.mjs";

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const dir = path.resolve("supabase/migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  await sql`create table if not exists public.schema_migrations (
    name text primary key, applied_at timestamptz not null default now())`;
  await sql`alter table public.schema_migrations enable row level security`;
  const applied = new Set((await sql`select name from public.schema_migrations`).map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const body = fs.readFileSync(path.join(dir, file), "utf8");
    process.stdout.write(`applying ${file} ... `);
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`insert into public.schema_migrations (name) values (${file})`;
    });
    console.log("ok");
  }
  console.log("migrations up to date");
} finally {
  await sql.end();
}
