import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/invites", () => ({
  getInviteByToken: vi.fn(),
  insertResponse: vi.fn(),
  markCompleted: vi.fn(),
  DuplicateResponseError: class DuplicateResponseError extends Error {},
}));
vi.mock("@/lib/notify", () => ({ notifyFeedback: vi.fn() }));

import { POST } from "@/app/api/submit/route";
import * as invites from "@/lib/invites";
import * as notify from "@/lib/notify";

const validBody = {
  token: "tok-1",
  relevance: 4, satisfaction: 5, clarity: 3, nps: 8, purchase_intent: 5,
  comment: "great",
};
const invite = {
  id: "inv-1", product: "Acme", prospect_name: "Mario", status: "pending",
  demo_owner: "alex@example.com", company: "ACME",
};

function req(body: unknown): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(invites.getInviteByToken).mockReset();
  vi.mocked(invites.insertResponse).mockReset().mockResolvedValue();
  vi.mocked(invites.markCompleted).mockReset().mockResolvedValue();
  vi.mocked(notify.notifyFeedback).mockReset().mockResolvedValue();
});

describe("POST /api/submit", () => {
  it("writes the response, marks completed, and notifies on the happy path", async () => {
    vi.mocked(invites.getInviteByToken).mockResolvedValue(invite);

    const res = await POST(req(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const row = vi.mocked(invites.insertResponse).mock.calls[0][0] as Record<string, unknown>;
    expect(row.invite_id).toBe("inv-1");
    expect(typeof row.score).toBe("number");
    expect(["hot", "warm", "cold"]).toContain(row.signal);
    expect(vi.mocked(invites.markCompleted)).toHaveBeenCalledWith("inv-1");

    expect(vi.mocked(notify.notifyFeedback)).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(notify.notifyFeedback).mock.calls[0][0];
    expect(arg).toMatchObject({
      demoOwner: "alex@example.com",
      prospectName: "Mario",
      company: "ACME",
      product: "Acme",
      comment: "great",
    });
    expect(typeof arg.score).toBe("number");
  });

  it("still returns 200 if the notification throws", async () => {
    vi.mocked(invites.getInviteByToken).mockResolvedValue(invite);
    vi.mocked(notify.notifyFeedback).mockRejectedValue(new Error("smtp down"));
    const res = await POST(req(validBody));
    expect(res.status).toBe(200);
  });

  it("returns 400 for an invalid payload (no DB calls)", async () => {
    const res = await POST(req({ ...validBody, nps: 99 }));
    expect(res.status).toBe(400);
    expect(vi.mocked(invites.getInviteByToken)).not.toHaveBeenCalled();
    expect(vi.mocked(notify.notifyFeedback)).not.toHaveBeenCalled();
  });

  it("returns 410 for an unknown token", async () => {
    vi.mocked(invites.getInviteByToken).mockResolvedValue(null);
    const res = await POST(req(validBody));
    expect(res.status).toBe(410);
    expect(vi.mocked(invites.insertResponse)).not.toHaveBeenCalled();
  });

  it("returns 409 for an already-completed invite and does not notify", async () => {
    vi.mocked(invites.getInviteByToken).mockResolvedValue({ ...invite, status: "completed" });
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    expect(vi.mocked(invites.insertResponse)).not.toHaveBeenCalled();
    expect(vi.mocked(notify.notifyFeedback)).not.toHaveBeenCalled();
  });

  it("returns 409 when the insert hits the unique constraint (race)", async () => {
    vi.mocked(invites.getInviteByToken).mockResolvedValue(invite);
    vi.mocked(invites.insertResponse).mockRejectedValue(new invites.DuplicateResponseError());
    const res = await POST(req(validBody));
    expect(res.status).toBe(409);
    expect(vi.mocked(invites.markCompleted)).not.toHaveBeenCalled();
    expect(vi.mocked(notify.notifyFeedback)).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const bad = new Request("http://localhost/api/submit", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json",
    });
    const res = await POST(bad);
    expect(res.status).toBe(400);
  });
});
