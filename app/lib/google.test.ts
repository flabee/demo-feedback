import { describe, it, expect, beforeEach, vi } from "vitest";
import { buildRawMessage, exchangeCode, refreshAccessToken, getUserEmail, InvalidGrantError, sendGmail } from "@/lib/google";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "csecret");
  vi.restoreAllMocks();
});

function decodeRaw(raw: string): string {
  return Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

describe("buildRawMessage", () => {
  it("builds a base64url MIME with encoded subject and both parts", () => {
    const raw = buildRawMessage({ from: "alex@example.com", to: "mario@acme.com", subject: "How did the demo go? 🎉", html: "<b>hi</b>", text: "hi" });
    const decoded = decodeRaw(raw);
    expect(decoded).toContain("From: alex@example.com");
    expect(decoded).toContain("To: mario@acme.com");
    expect(decoded).toContain("=?UTF-8?B?");
    expect(decoded).toContain("multipart/alternative");
    expect(decoded).toContain(Buffer.from("<b>hi</b>", "utf8").toString("base64"));
  });
});

describe("exchangeCode", () => {
  it("returns the tokens on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "at", refresh_token: "rt", scope: "s" }) }));
    expect(await exchangeCode("code", "https://app/cb")).toMatchObject({ access_token: "at", refresh_token: "rt" });
  });
  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "invalid_request" }) }));
    await expect(exchangeCode("code", "https://app/cb")).rejects.toThrow(/invalid_request/);
  });
});

describe("refreshAccessToken", () => {
  it("returns the access token on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "at-1" }) }));
    expect(await refreshAccessToken("rt")).toBe("at-1");
  });
  it("throws InvalidGrantError on invalid_grant", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "invalid_grant" }) }));
    await expect(refreshAccessToken("rt")).rejects.toBeInstanceOf(InvalidGrantError);
  });
  it("throws when a success response lacks access_token", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ token_type: "Bearer" }) }));
    await expect(refreshAccessToken("rt")).rejects.toThrow(/access_token/);
  });
  it("throws (without losing the path) on a non-JSON error body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => { throw new SyntaxError("not json"); } }));
    await expect(refreshAccessToken("rt")).rejects.toThrow();
  });
  it("forwards an AbortSignal to fetch", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ access_token: "at" }) });
    vi.stubGlobal("fetch", f);
    const signal = AbortSignal.timeout(1000);
    await refreshAccessToken("rt", { signal });
    expect(f.mock.calls[0][1].signal).toBe(signal);
  });
});

describe("getUserEmail", () => {
  it("returns the lowercased email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ email: "Alex@Example.com" }) }));
    expect(await getUserEmail("at")).toBe("alex@example.com");
  });
  it("throws when the response has no email", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
    await expect(getUserEmail("at")).rejects.toThrow(/email/);
  });
});

describe("sendGmail", () => {
  it("POSTs a raw message to the send endpoint", async () => {
    const okFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.stubGlobal("fetch", okFetch);
    await sendGmail("at", "alex@example.com", { to: "m@acme.com", subject: "s", html: "<b>h</b>", text: "t" });
    const [url, opts] = okFetch.mock.calls[0];
    expect(url).toContain("gmail/v1/users/me/messages/send");
    expect(JSON.parse(opts.body)).toHaveProperty("raw");
  });
  it("throws on a non-ok response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => "boom" }));
    await expect(sendGmail("at", "f", { to: "t", subject: "s", html: "h", text: "t" })).rejects.toThrow();
  });
});
