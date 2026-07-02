import { describe, it, expect } from "vitest";
import { mapRowToViewRow } from "@/lib/mappers";
import type { InviteRow } from "@/lib/types";

const base: InviteRow = {
  id: "inv-1",
  prospect_name: "Mario Rossi",
  prospect_email: "mario@acme.com",
  product: "Acme",
  demo_owner: "Alex",
  status: "pending",
  created_at: "2026-06-20T10:00:00Z",
  completed_at: null,
  responses: null,
};

describe("mapRowToViewRow", () => {
  it("maps a pending invite (no response) with nulls and derived company", () => {
    const row = mapRowToViewRow(base);
    expect(row).toMatchObject({
      id: "inv-1",
      prospectName: "Mario Rossi",
      company: "Acme",
      status: "pending",
      score: null,
      signal: null,
      nps: null,
      ratings: null,
      comment: null,
      date: "2026-06-20T10:00:00Z",
    });
  });

  it("maps a completed invite using the response data", () => {
    const row = mapRowToViewRow({
      ...base,
      status: "completed",
      completed_at: "2026-06-21T09:00:00Z",
      responses: [
        {
          relevance: 4, satisfaction: 5, clarity: 4, nps: 9,
          purchase_intent: 5, comment: "Great", score: 88,
          signal: "hot", submitted_at: "2026-06-21T09:00:00Z",
        },
      ],
    });
    expect(row).toMatchObject({
      status: "completed",
      score: 88,
      signal: "hot",
      nps: 9,
      ratings: { relevance: 4, satisfaction: 5, clarity: 4, purchaseIntent: 5 },
      comment: "Great",
      date: "2026-06-21T09:00:00Z",
    });
  });

  it("falls back to deriving the signal from score if stored signal is missing", () => {
    const row = mapRowToViewRow({
      ...base,
      status: "completed",
      responses: [
        {
          relevance: 3, satisfaction: 3, clarity: 3, nps: 6,
          purchase_intent: 3, comment: null, score: 60,
          signal: "", submitted_at: "2026-06-21T09:00:00Z",
        },
      ],
    });
    expect(row.signal).toBe("warm");
  });
});
