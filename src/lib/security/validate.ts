/**
 * Small, dependency-free input validation for FormData and JSON payloads.
 * Every server action validates through these before touching the database.
 */

export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

type Source = FormData | Record<string, unknown>;

function raw(src: Source, name: string): unknown {
  return src instanceof FormData ? src.get(name) : src[name];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface StrOpts {
  min?: number;
  max?: number;
  pattern?: RegExp;
  label?: string;
}

export function optStr(src: Source, name: string, opts: StrOpts = {}): string {
  const v = raw(src, name);
  if (v === null || v === undefined) return "";
  if (typeof v !== "string") throw new ValidationError(name, `${opts.label ?? name} is invalid.`);
  const s = v.trim();
  const max = opts.max ?? 500;
  if (s.length > max) throw new ValidationError(name, `${opts.label ?? name} must be at most ${max} characters.`);
  if (s && opts.pattern && !opts.pattern.test(s)) throw new ValidationError(name, `${opts.label ?? name} is invalid.`);
  return s;
}

export function str(src: Source, name: string, opts: StrOpts = {}): string {
  const s = optStr(src, name, opts);
  const min = opts.min ?? 1;
  if (s.length < min) {
    throw new ValidationError(name, min === 1 ? `${opts.label ?? name} is required.` : `${opts.label ?? name} must be at least ${min} characters.`);
  }
  return s;
}

export function email(src: Source, name = "email"): string {
  const s = str(src, name, { max: 254, label: "Email" }).toLowerCase();
  if (!EMAIL_RE.test(s)) throw new ValidationError(name, "Enter a valid email address.");
  return s;
}

export function uuid(src: Source, name: string): string {
  const s = str(src, name, { max: 36 });
  if (!UUID_RE.test(s)) throw new ValidationError(name, `${name} is invalid.`);
  return s;
}

export function optUuid(src: Source, name: string): string | null {
  const s = optStr(src, name, { max: 36 });
  if (!s) return null;
  if (!UUID_RE.test(s)) throw new ValidationError(name, `${name} is invalid.`);
  return s;
}

export function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

interface IntOpts {
  min?: number;
  max?: number;
  label?: string;
}

export function optInt(src: Source, name: string, opts: IntOpts = {}): number | null {
  const v = raw(src, name);
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).trim());
  if (!Number.isInteger(n)) throw new ValidationError(name, `${opts.label ?? name} must be a whole number.`);
  if (opts.min !== undefined && n < opts.min) throw new ValidationError(name, `${opts.label ?? name} must be at least ${opts.min}.`);
  if (opts.max !== undefined && n > opts.max) throw new ValidationError(name, `${opts.label ?? name} must be at most ${opts.max}.`);
  return n;
}

export function int(src: Source, name: string, opts: IntOpts = {}): number {
  const n = optInt(src, name, opts);
  if (n === null) throw new ValidationError(name, `${opts.label ?? name} is required.`);
  return n;
}

/** "12.50" → 1250. Rejects negatives and more than two decimals. */
export function optMoney(src: Source, name: string, label = name): number | null {
  const v = raw(src, name);
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const s = String(v).trim().replace(/,/g, "");
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) throw new ValidationError(name, `${label} must be an amount like 49.99.`);
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

export function money(src: Source, name: string, label = name): number {
  const n = optMoney(src, name, label);
  if (n === null) throw new ValidationError(name, `${label} is required.`);
  return n;
}

export function bool(src: Source, name: string): boolean {
  const v = raw(src, name);
  return v === true || v === "on" || v === "true" || v === "1";
}

export function oneOf<T extends string>(src: Source, name: string, values: readonly T[], fallback?: T): T {
  const s = optStr(src, name, { max: 64 });
  if (!s && fallback !== undefined) return fallback;
  if (!(values as readonly string[]).includes(s)) throw new ValidationError(name, `${name} is invalid.`);
  return s as T;
}

export function country(src: Source, name: string): string {
  const s = str(src, name, { max: 2, label: "Country" }).toUpperCase();
  if (!/^[A-Z]{2}$/.test(s)) throw new ValidationError(name, "Choose a country.");
  return s;
}

/** Comma/newline separated list → trimmed unique strings. */
export function list(src: Source, name: string, max = 50): string[] {
  const s = optStr(src, name, { max: 4000 });
  return [...new Set(s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean))].slice(0, max);
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export function passwordStrength(password: string): string | null {
  if (password.length < 10) return "Use at least 10 characters.";
  if (password.length > 200) return "Password is too long.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return "Use letters and at least one number.";
  return null;
}

export interface ActionState {
  ok: boolean;
  error?: string;
  field?: string;
  message?: string;
}

/** Converts thrown validation/domain errors into a form-friendly state. */
export function toActionError(err: unknown): ActionState {
  if (err instanceof ValidationError) return { ok: false, error: err.message, field: err.field };
  if (err instanceof UserFacingError) return { ok: false, error: err.message };
  // Next's redirect()/notFound() throw control-flow errors that must propagate.
  if (err && typeof err === "object" && "digest" in err && typeof (err as { digest: unknown }).digest === "string") {
    const d = (err as { digest: string }).digest;
    if (d.startsWith("NEXT_REDIRECT") || d.startsWith("NEXT_HTTP_ERROR_FALLBACK") || d === "NEXT_NOT_FOUND") throw err;
  }
  console.error("[action] unexpected error", err);
  return { ok: false, error: "Something went wrong. Nothing was saved — please try again." };
}

/** An error whose message is safe to show to the user. */
export class UserFacingError extends Error {}
