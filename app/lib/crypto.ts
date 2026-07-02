import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const b64 = process.env.TOKEN_ENC_KEY;
  if (!b64) throw new Error("TOKEN_ENC_KEY is not set");
  const k = Buffer.from(b64, "base64");
  if (k.length !== 32) throw new Error("TOKEN_ENC_KEY must decode to 32 bytes");
  return k;
}

/** Encrypt a secret to `v1:<iv>:<tag>:<ciphertext>` (all base64). */
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptToken(blob: string): string {
  const [v, ivB64, tagB64, ctB64] = blob.split(":");
  if (v !== "v1" || !ivB64 || !tagB64 || !ctB64) throw new Error("Malformed token blob");
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  if (iv.length !== 12 || tag.length !== 16) throw new Error("Malformed token blob");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}
