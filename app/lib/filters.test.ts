import { describe, it, expect } from "vitest";
import { parseFilters, applyFilters } from "@/lib/filters";
import type { ViewRow } from "@/lib/types";

function makeRow(over: Partial<ViewRow>): ViewRow {
  return {
    id: "x", prospectName: "Jane Doe", prospectEmail: "jane@acme.com",
    company: "Acme", product: "Acme", demoOwner: "Alex",
    status: "completed", score: 80, signal: "hot", nps: 9,
    ratings: { relevance: 4, satisfaction: 4, clarity: 4, purchaseIntent: 4 },
    comment: null, date: "2026-06-20T10:00:00Z", ...over,
  };
}

describe("parseFilters", () => {
  it("applies defaults for missing params", () => {
    expect(parseFilters({})).toEqual({
      signal: "all", product: "all", period: "all", q: "",
    });
  });

  it("reads provided params and ignores invalid enums", () => {
    expect(parseFilters({ signal: "hot", product: "Acme", period: "30d", q: "ac" }))
      .toEqual({ signal: "hot", product: "Acme", period: "30d", q: "ac" });
    expect(parseFilters({ signal: "bogus", period: "bogus" }))
      .toMatchObject({ signal: "all", period: "all" });
  });

  it("takes the first value when a param is an array", () => {
    expect(parseFilters({ signal: ["hot", "cold"] }).signal).toBe("hot");
  });
});

describe("applyFilters", () => {
  const rows: ViewRow[] = [
    makeRow({ id: "1", signal: "hot", product: "Acme", prospectEmail: "a@acme.com", date: "2026-06-25T00:00:00Z" }),
    makeRow({ id: "2", signal: "cold", product: "Beacon", prospectEmail: "b@globex.com", company: "Globex", date: "2026-01-01T00:00:00Z" }),
    makeRow({ id: "3", status: "pending", signal: null, score: null, product: "Acme", prospectEmail: "c@acme.com", date: "2026-06-26T00:00:00Z" }),
  ];

  it("returns all rows with default filters", () => {
    expect(applyFilters(rows, parseFilters({})).map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("filters by signal", () => {
    expect(applyFilters(rows, parseFilters({ signal: "hot" })).map((r) => r.id)).toEqual(["1"]);
  });

  it("filters pending via the pending signal value", () => {
    expect(applyFilters(rows, parseFilters({ signal: "pending" })).map((r) => r.id)).toEqual(["3"]);
  });

  it("filters by product", () => {
    expect(applyFilters(rows, parseFilters({ product: "Acme" })).map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by free-text against name and email (case-insensitive)", () => {
    expect(applyFilters(rows, parseFilters({ q: "ACME" })).map((r) => r.id)).toEqual(["1", "3"]);
  });

  it("filters by free-text against the derived company label", () => {
    expect(applyFilters(rows, parseFilters({ q: "globex" })).map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by period using a reference now", () => {
    const now = new Date("2026-06-27T00:00:00Z");
    const out = applyFilters(rows, parseFilters({ period: "30d" }), now);
    expect(out.map((r) => r.id)).toEqual(["1", "3"]);
  });
});
