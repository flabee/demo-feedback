import { describe, it, expect, beforeEach, vi } from "vitest";
import { encryptToken, decryptToken } from "@/lib/crypto";

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("TOKEN_ENC_KEY", Buffer.alloc(32, 7).toString("base64"));
});

describe("crypto", () => {
  it("round-trips a token", () => {
    const blob = encryptToken("refresh-abc-123");
    expect(blob.startsWith("v1:")).toBe(true);
    expect(blob).not.toContain("refresh-abc-123");
    expect(decryptToken(blob)).toBe("refresh-abc-123");
  });

  it("produces a different ciphertext each time (random IV)", () => {
    expect(encryptToken("x")).not.toBe(encryptToken("x"));
  });

  it("throws when the ciphertext is tampered with", () => {
    const [v, iv, tag] = encryptToken("secret").split(":");
    const badCt = Buffer.from("zzzz").toString("base64");
    expect(() => decryptToken(`${v}:${iv}:${tag}:${badCt}`)).toThrow();
  });

  it("throws when the key is missing or wrong length", () => {
    vi.stubEnv("TOKEN_ENC_KEY", "");
    expect(() => encryptToken("x")).toThrow();
  });

  it("throws on a blob with a wrong-length IV or tag", () => {
    const [v, , , ct] = encryptToken("secret").split(":");
    const shortIv = Buffer.alloc(8).toString("base64");
    const goodTag = Buffer.alloc(16).toString("base64");
    expect(() => decryptToken(`${v}:${shortIv}:${goodTag}:${ct}`)).toThrow("Malformed token blob");
  });
});
