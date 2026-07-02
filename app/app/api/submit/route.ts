import { NextResponse } from "next/server";
import { validateSubmission, buildResponseRow } from "@/lib/submit";
import { computeScore, scoreToSignal } from "@/lib/scoring";
import {
  getInviteByToken,
  insertResponse,
  markCompleted,
  DuplicateResponseError,
} from "@/lib/invites";
import { notifyFeedback } from "@/lib/notify";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = validateSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const payload = result.value;

  let invite;
  try {
    invite = await getInviteByToken(payload.token);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
  if (!invite) {
    return NextResponse.json({ error: "Invalid token" }, { status: 410 });
  }
  if (invite.status === "completed") {
    return NextResponse.json({ error: "Already submitted" }, { status: 409 });
  }

  const score = computeScore(payload);
  const signal = scoreToSignal(score);

  try {
    await insertResponse(buildResponseRow(invite.id, payload, score, signal));
    await markCompleted(invite.id);
  } catch (err) {
    // A concurrent/duplicate submit lost the race against the unique constraint.
    if (err instanceof DuplicateResponseError) {
      return NextResponse.json({ error: "Already submitted" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Best-effort: tell the demo owner a response arrived. notifyFeedback never
  // throws, but guard anyway so nothing can affect the prospect's success.
  try {
    await notifyFeedback({
      demoOwner: invite.demo_owner,
      prospectName: invite.prospect_name,
      company: invite.company,
      product: invite.product,
      score,
      signal,
      comment: payload.comment,
    });
  } catch {
    // ignore — the response is already saved
  }

  return NextResponse.json({ ok: true });
}
