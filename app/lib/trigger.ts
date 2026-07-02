import { randomUUID, timingSafeEqual } from "node:crypto";

export function generateToken(): string {
  return randomUUID();
}

/** Constant-time check of an `Authorization: Bearer <secret>` header. */
export function checkSecret(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret || !authHeader) return false;
  const prefix = "Bearer ";
  if (!authHeader.startsWith(prefix)) return false;
  const provided = Buffer.from(authHeader.slice(prefix.length));
  const expected = Buffer.from(secret);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
