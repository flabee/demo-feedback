import { describe, it, expect, beforeEach, vi } from "vitest";

const upsert = vi.fn();
const eqSelect = vi.fn(); // resolves { data, error } for the select().eq() chain

vi.mock("@/lib/supabase", () => ({
  createServerSupabase: () => ({
    from: () => ({
      upsert,
      select: () => ({ eq: eqSelect }),
    }),
  }),
}));

vi.mock("@/lib/crypto", () => ({
  encryptToken: (s: string) => `enc(${s})`,
  decryptToken: (s: string) => s.replace(/^enc\(/, "").replace(/\)$/, ""),
}));

import { upsertConnection, getActiveConnections, getConnectionForSend } from "@/lib/connections";

beforeEach(() => {
  upsert.mockReset().mockResolvedValue({ error: null });
  eqSelect.mockReset();
});

describe("connections", () => {
  it("encrypts the refresh token on upsert", async () => {
    await upsertConnection("alex@example.com", "rt-123", "scope");
    const row = upsert.mock.calls[0][0];
    expect(row.email).toBe("alex@example.com");
    expect(row.refresh_token).toBe("enc(rt-123)");
    expect(row.status).toBe("active");
  });

  it("throws when the upsert returns an error", async () => {
    upsert.mockResolvedValue({ error: { message: "boom" } });
    await expect(upsertConnection("a@b.com", "rt", "s")).rejects.toThrow(/boom/);
  });

  it("decrypts the refresh token on getActiveConnections", async () => {
    eqSelect.mockResolvedValue({
      data: [{ email: "alex@example.com", refresh_token: "enc(rt-xyz)", scopes: "s", status: "active" }],
      error: null,
    });
    const conns = await getActiveConnections();
    expect(conns).toEqual([
      { email: "alex@example.com", refreshToken: "rt-xyz", scopes: "s", status: "active" },
    ]);
  });

  it("returns the decrypted token for an active connection", async () => {
    eqSelect.mockResolvedValue({
      data: [{ refresh_token: "enc(rt-1)", status: "active" }],
      error: null,
    });
    expect(await getConnectionForSend("alex@example.com")).toEqual({ refreshToken: "rt-1" });
  });

  it("returns null when the connection is missing or not active", async () => {
    eqSelect.mockResolvedValue({ data: [{ refresh_token: "enc(x)", status: "needs_reconsent" }], error: null });
    expect(await getConnectionForSend("a@b.com")).toBeNull();
    eqSelect.mockResolvedValue({ data: [], error: null });
    expect(await getConnectionForSend("a@b.com")).toBeNull();
  });
});
