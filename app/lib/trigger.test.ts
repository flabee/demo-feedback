import { describe, it, expect } from "vitest";
import { generateToken, checkSecret } from "@/lib/trigger";

describe("generateToken", () => {
  it("returns a non-empty string and two calls differ", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});

describe("checkSecret", () => {
  it("returns true for a matching Bearer secret", () => {
    expect(checkSecret("Bearer s3cret", "s3cret")).toBe(true);
  });
  it("returns false for a mismatched secret", () => {
    expect(checkSecret("Bearer wrong", "s3cret")).toBe(false);
  });
  it("returns false for a missing Bearer prefix", () => {
    expect(checkSecret("s3cret", "s3cret")).toBe(false);
  });
  it("returns false for a null header or undefined secret", () => {
    expect(checkSecret(null, "s3cret")).toBe(false);
    expect(checkSecret("Bearer s3cret", undefined)).toBe(false);
  });
  it("returns false when lengths differ (no throw)", () => {
    expect(checkSecret("Bearer s3", "s3cret")).toBe(false);
  });
});
