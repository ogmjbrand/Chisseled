#!/usr/bin/env node
// Creates the first owner account for /admin. Run once after migrating:
//   npm run admin:create-owner -- --email you@chisseled.com --name "Your Name"
// The password is read from ADMIN_PASSWORD or prompted (never passed as an argument,
// so it doesn't end up in shell history).
import { randomBytes, scrypt } from "node:crypto";
import readline from "node:readline";
import postgres from "postgres";
import { loadEnv } from "./lib/env.mjs";

loadEnv();
const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith("--") ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const email = String(args.email ?? "").trim().toLowerCase();
const name = String(args.name ?? "").trim();
const role = String(args.role ?? "owner");
if (!email || !name) {
  console.error('Usage: npm run admin:create-owner -- --email you@example.com --name "Your Name" [--role owner]');
  process.exit(1);
}

async function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => (rl.close(), resolve(a))));
}

const password = process.env.ADMIN_PASSWORD ?? (await ask("Password (min 12 chars): "));
if (password.length < 12 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
  console.error("Use at least 12 characters with letters and a number.");
  process.exit(1);
}

const N = 1 << 15, r = 8, p = 1;
const salt = randomBytes(16);
const key = await new Promise((res, rej) =>
  scrypt(password.normalize("NFKC"), salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? rej(e) : res(k))),
);
const hash = ["scrypt", N, r, p, salt.toString("base64"), key.toString("base64")].join("$");

const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  const [row] = await sql`
    insert into staff_users (email, name, password_hash, role_id)
    select ${email}, ${name}, ${hash}, id from roles where key = ${role}
    on conflict (email) do update set password_hash = excluded.password_hash, role_id = excluded.role_id, status = 'active',
      failed_login_count = 0, locked_until = null
    returning id`;
  if (!row) throw new Error(`Unknown role "${role}"`);
  await sql`insert into audit_logs (staff_id, actor, action, entity_type, entity_id) values (${row.id}, 'cli', 'staff.bootstrap', 'staff', ${row.id})`;
  console.log(`${role} account ready for ${email}. Sign in at /admin/login`);
} finally {
  await sql.end();
}
