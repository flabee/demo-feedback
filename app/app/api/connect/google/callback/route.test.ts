import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/google", () => ({ exchangeCode: vi.fn(), getUserEmail: vi.fn() }));
vi.mock("@/lib/connections", () => ({ upsertConnection: vi.fn() }));
const cookieGet = vi.fn();
vi.mock("next/headers", () => ({ cookies: async () => ({ get: cookieGet, delete: vi.fn() }) }));

import { GET } from "@/app/api/connect/google/callback/route";
import * as authMod from "@/lib/auth";
import * as google from "@/lib/google";
import * as connections from "@/lib/connections";

function req(qs: string) {
  return new Request(`https://app.example.com/api/connect/google/callback?${qs}`);
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "https://app.example.com");
  vi.mocked(authMod.auth).mockReset().mockResolvedValue({ user: { email: "alex@example.com" } } as never);
  vi.mocked(google.exchangeCode).mockReset();
  vi.mocked(google.getUserEmail).mockReset();
  vi.mocked(connections.upsertConnection).mockReset().mockResolvedValue();
  cookieGet.mockReset().mockReturnValue({ value: "st8:alex@example.com" });
});

describe("GET /api/connect/google/callback", () => {
  it("returns 500 when APP_URL is unset", async () => {
    vi.stubEnv("APP_URL", "");
    expect((await GET(req("code=abc&state=st8"))).status).toBe(500);
  });

  it("redirects unauthenticated users to /signin", async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    const res = await GET(req("code=abc&state=st8"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/signin");
  });

  it("rejects a bad state and clears the cookie", async () => {
    const res = await GET(req("code=abc&state=WRONG"));
    expect(res.status).toBe(400);
    expect(vi.mocked(google.exchangeCode)).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie")).toContain("gconnect_state=");
  });

  it("rejects when the consented account differs from the session", async () => {
    vi.mocked(google.exchangeCode).mockResolvedValue({ access_token: "at", refresh_token: "rt", scope: "s" });
    vi.mocked(google.getUserEmail).mockResolvedValue("someone-else@example.com");
    const res = await GET(req("code=abc&state=st8"));
    expect(res.headers.get("location")).toContain("error=mismatch");
    expect(vi.mocked(connections.upsertConnection)).not.toHaveBeenCalled();
  });

  it("stores the token, clears the cookie, and redirects on success", async () => {
    vi.mocked(google.exchangeCode).mockResolvedValue({ access_token: "at", refresh_token: "rt", scope: "s" });
    vi.mocked(google.getUserEmail).mockResolvedValue("alex@example.com");
    const res = await GET(req("code=abc&state=st8"));
    expect(vi.mocked(connections.upsertConnection)).toHaveBeenCalledWith("alex@example.com", "rt", "s");
    expect(res.headers.get("location")).toContain("/dashboard?connected=1");
    expect(res.headers.get("set-cookie")).toContain("gconnect_state=");
  });

  it("redirects with norefresh when no refresh_token is returned", async () => {
    vi.mocked(google.exchangeCode).mockResolvedValue({ access_token: "at", scope: "s" });
    const res = await GET(req("code=abc&state=st8"));
    expect(res.headers.get("location")).toContain("error=norefresh");
    expect(vi.mocked(connections.upsertConnection)).not.toHaveBeenCalled();
  });
});
