import { describe, it, expect } from "vitest";
import { validateSubmission, buildResponseRow } from "@/lib/submit";
import type { SubmissionPayload } from "@/lib/types";

const valid = {
  token: "tok-1",
  relevance: 4, satisfaction: 5, clarity: 3, nps: 8, purchase_intent: 5,
  comment: "  ottimo  ",
};

describe("validateSubmission", () => {
  it("accepts a valid payload and trims the comment", () => {
    const r = validateSubmission(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.token).toBe("tok-1");
      expect(r.value.comment).toBe("ottimo");
      expect(r.value.purchase_intent).toBe(5);
    }
  });

  it("treats an empty/whitespace comment as undefined", () => {
    const r = validateSubmission({ ...valid, comment: "   " });
    expect(r.ok && r.value.comment).toBeUndefined();
  });

  it("accepts a missing comment", () => {
    const { comment, ...noComment } = valid;
    const r = validateSubmission(noComment);
    expect(r.ok).toBe(true);
  });

  it("rejects a missing/empty token", () => {
    expect(validateSubmission({ ...valid, token: "" }).ok).toBe(false);
    expect(validateSubmission({ ...valid, token: undefined }).ok).toBe(false);
  });

  it("rejects an over-long token", () => {
    expect(validateSubmission({ ...valid, token: "x".repeat(257) }).ok).toBe(false);
  });

  it("rejects 1–5 ratings out of range or non-integer", () => {
    expect(validateSubmission({ ...valid, relevance: 0 }).ok).toBe(false);
    expect(validateSubmission({ ...valid, satisfaction: 6 }).ok).toBe(false);
    expect(validateSubmission({ ...valid, clarity: 2.5 }).ok).toBe(false);
    expect(validateSubmission({ ...valid, purchase_intent: -1 }).ok).toBe(false);
  });

  it("rejects nps out of 0–10", () => {
    expect(validateSubmission({ ...valid, nps: 11 }).ok).toBe(false);
    expect(validateSubmission({ ...valid, nps: -1 }).ok).toBe(false);
  });

  it("rejects a non-object and a non-string comment", () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission({ ...valid, comment: 5 }).ok).toBe(false);
  });

  it("rejects a comment over the length cap", () => {
    expect(validateSubmission({ ...valid, comment: "x".repeat(2001) }).ok).toBe(false);
  });
});

describe("buildResponseRow", () => {
  it("shapes a DB row with snake_case fields and null comment fallback", () => {
    const payload: SubmissionPayload = {
      token: "tok-1", relevance: 4, satisfaction: 5, clarity: 3, nps: 8, purchase_intent: 5,
    };
    const row = buildResponseRow("inv-1", payload, 86, "hot");
    expect(row).toEqual({
      invite_id: "inv-1",
      relevance: 4, satisfaction: 5, clarity: 3, nps: 8, purchase_intent: 5,
      comment: null, score: 86, signal: "hot",
    });
  });
});
