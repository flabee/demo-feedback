import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/connections", () => ({ deleteConnection: vi.fn() }));

import { POST } from "@/app/api/connect/google/disconnect/route";
import * as authMod from "@/lib/auth";
import * as connections from "@/lib/connections";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "https://app.example.com");
  vi.mocked(authMod.auth).mockReset();
  vi.mocked(connections.deleteConnection).mockReset().mockResolvedValue();
});

describe("POST /api/connect/google/disconnect", () => {
  it("401 when unauthenticated", async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    expect((await POST()).status).toBe(401);
    expect(vi.mocked(connections.deleteConnection)).not.toHaveBeenCalled();
  });

  it("deletes the caller's connection and redirects", async () => {
    vi.mocked(authMod.auth).mockResolvedValue({ user: { email: "alex@example.com" } } as never);
    const res = await POST();
    expect(vi.mocked(connections.deleteConnection)).toHaveBeenCalledWith("alex@example.com");
    expect(res.headers.get("location")).toContain("/dashboard?disconnected=1");
  });
});
