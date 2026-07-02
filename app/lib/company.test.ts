import { describe, it, expect } from "vitest";
import { deriveCompany } from "@/lib/company";

describe("deriveCompany", () => {
  it("derives a capitalized label from a company domain", () => {
    expect(deriveCompany("mario@acme.com")).toBe("Acme");
    expect(deriveCompany("a.b@Example.com")).toBe("Example");
  });

  it("handles multi-part ccTLD domains", () => {
    expect(deriveCompany("jane@acme.co.uk")).toBe("Acme");
  });

  it("returns null for generic email providers", () => {
    expect(deriveCompany("someone@gmail.com")).toBeNull();
    expect(deriveCompany("someone@outlook.com")).toBeNull();
  });

  it("returns null for malformed input", () => {
    expect(deriveCompany("not-an-email")).toBeNull();
    expect(deriveCompany("missing@domain")).toBeNull();
    expect(deriveCompany("")).toBeNull();
  });
});
