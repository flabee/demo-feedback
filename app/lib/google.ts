import "server-only";
import { randomBytes } from "node:crypto";
import type { CalendarEvent } from "@/lib/demo-detection";

const TOKEN_URL = "https://oauth2.googleapis.com/token";

export class InvalidGrantError extends Error {
  constructor() {
    super("invalid_grant");
    this.name = "InvalidGrantError";
  }
}

function creds() {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!client_id || !client_secret) {
    throw new Error("GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set");
  }
  return { client_id, client_secret };
}

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** RFC 5322 multipart/alternative message, base64url-encoded for Gmail's `raw`. */
export function buildRawMessage(msg: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): string {
  const boundary = "b_" + randomBytes(12).toString("hex");
  const subject = `=?UTF-8?B?${Buffer.from(msg.subject, "utf8").toString("base64")}?=`;
  const lines = [
    `From: ${msg.from}`,
    `To: ${msg.to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(msg.text, "utf8").toString("base64"),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(msg.html, "utf8").toString("base64"),
    `--${boundary}--`,
    "",
  ];
  return b64url(Buffer.from(lines.join("\r\n"), "utf8"));
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<{ access_token: string; refresh_token?: string; scope?: string; expires_in?: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...creds(), code, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error(`Code exchange failed: ${(data.error as string) ?? res.status}`);
  return data as { access_token: string; refresh_token?: string; scope?: string; expires_in?: number };
}

export async function refreshAccessToken(
  refreshToken: string,
  opts?: { signal?: AbortSignal },
): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...creds(), refresh_token: refreshToken, grant_type: "refresh_token" }),
    signal: opts?.signal,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    if (data.error === "invalid_grant") throw new InvalidGrantError();
    throw new Error(`Token refresh failed: ${(data.error as string) ?? res.status}`);
  }
  const token = data.access_token as string | undefined;
  if (!token) throw new Error("Token refresh succeeded but access_token is missing");
  return token;
}

export async function getUserEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const email = data.email;
  if (typeof email !== "string" || !email.includes("@")) throw new Error("userinfo did not return an email");
  return email.toLowerCase();
}

export async function listPrimaryEvents(
  accessToken: string,
  timeMinIso: string,
  timeMaxIso: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: timeMinIso,
    timeMax: timeMaxIso,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  const data = await res.json();
  return data.items ?? [];
}

export async function sendGmail(
  accessToken: string,
  from: string,
  msg: { to: string; subject: string; html: string; text: string },
  opts?: { signal?: AbortSignal },
): Promise<void> {
  const raw = buildRawMessage({ from, ...msg });
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
    signal: opts?.signal,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Gmail send failed: ${res.status} ${t}`);
  }
}
