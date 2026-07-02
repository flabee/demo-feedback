import type { SubmissionPayload } from "@/lib/types";
import type { Signal } from "@/lib/scoring";

const COMMENT_MAX = 2000;
const TOKEN_MAX = 256;

type ValidationResult =
  | { ok: true; value: SubmissionPayload }
  | { ok: false; error: string };

function isIntInRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

export function validateSubmission(input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null) {
    return { ok: false, error: "Invalid payload" };
  }
  const p = input as Record<string, unknown>;

  if (typeof p.token !== "string" || p.token.trim() === "") {
    return { ok: false, error: "Missing token" };
  }
  if (p.token.length > TOKEN_MAX) {
    return { ok: false, error: "Invalid token" };
  }

  const five = ["relevance", "satisfaction", "clarity", "purchase_intent"] as const;
  for (const field of five) {
    if (!isIntInRange(p[field], 1, 5)) {
      return { ok: false, error: `Invalid ${field}` };
    }
  }
  if (!isIntInRange(p.nps, 0, 10)) {
    return { ok: false, error: "Invalid nps" };
  }

  let comment: string | undefined;
  if (p.comment !== undefined && p.comment !== null) {
    if (typeof p.comment !== "string") {
      return { ok: false, error: "Invalid comment" };
    }
    const trimmed = p.comment.trim();
    if (trimmed.length > COMMENT_MAX) {
      return { ok: false, error: "Comment too long" };
    }
    comment = trimmed === "" ? undefined : trimmed;
  }

  return {
    ok: true,
    value: {
      token: p.token,
      relevance: p.relevance as number,
      satisfaction: p.satisfaction as number,
      clarity: p.clarity as number,
      nps: p.nps as number,
      purchase_intent: p.purchase_intent as number,
      comment,
    },
  };
}

export function buildResponseRow(
  inviteId: string,
  payload: SubmissionPayload,
  score: number,
  signal: Signal,
) {
  return {
    invite_id: inviteId,
    relevance: payload.relevance,
    satisfaction: payload.satisfaction,
    clarity: payload.clarity,
    nps: payload.nps,
    purchase_intent: payload.purchase_intent,
    comment: payload.comment ?? null,
    score,
    signal,
  };
}
