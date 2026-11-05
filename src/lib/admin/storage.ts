import { randomToken } from "@/lib/security/crypto";
import { UserFacingError } from "@/lib/security/validate";

const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Uploads a product image to Supabase Storage (public bucket) with the
 * service-role key, server-side only. Validates type by magic bytes, not by
 * the browser-supplied MIME type alone.
 */
export async function uploadImage(file: File, prefix: string): Promise<string> {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";
  if (!base || !key) throw new UserFacingError("Image upload isn't configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Paste an image URL instead.");
  if (file.size > MAX_BYTES) throw new UserFacingError("Images must be 8 MB or smaller.");
  const ext = TYPES[file.type];
  if (!ext) throw new UserFacingError("Use a JPEG, PNG, WebP or AVIF image.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sig = Array.from(bytes.slice(0, 12)).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ok =
    sig.startsWith("ffd8ff") || // jpeg
    sig.startsWith("89504e47") || // png
    (sig.startsWith("52494646") && sig.slice(16, 24) === "57454250") || // webp
    sig.slice(8, 24) === "6674797061766966"; // avif ("ftypavif")
  if (!ok) throw new UserFacingError("That file isn't a valid image.");

  const path = `${prefix}/${Date.now()}-${randomToken(6).replace(/[^a-zA-Z0-9]/g, "")}.${ext}`;
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": file.type, "x-upsert": "false", "cache-control": "31536000" },
    body: bytes,
  });
  if (!res.ok) throw new UserFacingError(`Upload failed (${res.status}). Check that the "${bucket}" bucket exists and is public.`);
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
