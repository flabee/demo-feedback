import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { GET } from "@/app/api/connect/google/start/route";
import * as authMod from "@/lib/auth";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "https://app.example.com");
  vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
  vi.mocked(authMod.auth).mockReset();
});

describe("GET /api/connect/google/start", () => {
  it("redirects unauthenticated users to /signin", async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/signin");
  });

  it("redirects to Google consent with the right scopes and sets a state cookie", async () => {
    vi.mocked(authMod.auth).mockResolvedValue({ user: { email: "alex@example.com" } } as never);
    const res = await GET();
    const loc = res.headers.get("location")!;
    expect(loc).toContain("accounts.google.com");
    expect(loc).toContain("gmail.send");
    expect(loc).toContain("calendar.events.readonly");
    expect(loc).toContain("access_type=offline");
    expect(loc).toContain("prompt=consent");
    expect(res.headers.get("set-cookie")).toContain("gconnect_state=");
  });
});
