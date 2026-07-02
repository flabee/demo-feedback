import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/connections", () => ({
  getActiveConnections: vi.fn(),
  markNeedsReconsent: vi.fn(),
  markPolled: vi.fn(),
}));
vi.mock("@/lib/google", () => ({
  refreshAccessToken: vi.fn(),
  listPrimaryEvents: vi.fn(),
  sendGmail: vi.fn(),
  InvalidGrantError: class InvalidGrantError extends Error {},
}));
vi.mock("@/lib/invites", () => ({
  getInviteByEventId: vi.fn(),
  createInvite: vi.fn(),
  markEmailSent: vi.fn(),
  DuplicateInviteError: class DuplicateInviteError extends Error {},
}));
vi.mock("@/lib/trigger", () => ({ generateToken: () => "tok-generated" }));
vi.mock("@/lib/email", () => ({ buildEmail: () => ({ subject: "s", html: "<b>h</b>", text: "t" }) }));

import { runPoll } from "@/lib/poll";
import * as connections from "@/lib/connections";
import * as google from "@/lib/google";
import * as invites from "@/lib/invites";

const NOW = 1_800_000_000_000;
function endedEvent(id = "evt-1") {
  return {
    id,
    summary: "Demo Acme",
    description: "",
    attendees: [{ email: "alex@example.com", self: true }, { email: "mario@acme.com", displayName: "Mario" }],
    end: { dateTime: new Date(NOW - 60_000).toISOString() },
  };
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "https://app.example.com");
  vi.mocked(connections.getActiveConnections).mockReset();
  vi.mocked(connections.markPolled).mockReset().mockResolvedValue();
  vi.mocked(connections.markNeedsReconsent).mockReset().mockResolvedValue();
  vi.mocked(google.refreshAccessToken).mockReset();
  vi.mocked(google.listPrimaryEvents).mockReset();
  vi.mocked(google.sendGmail).mockReset().mockResolvedValue();
  vi.mocked(invites.getInviteByEventId).mockReset();
  vi.mocked(invites.createInvite).mockReset();
  vi.mocked(invites.markEmailSent).mockReset().mockResolvedValue();

  vi.mocked(connections.getActiveConnections).mockResolvedValue([
    { email: "alex@example.com", refreshToken: "rt", scopes: "s", status: "active" },
  ]);
  vi.mocked(google.refreshAccessToken).mockResolvedValue("at");
  vi.mocked(google.listPrimaryEvents).mockResolvedValue([endedEvent()]);
});

describe("runPoll", () => {
  it("creates the invite and sends for a new demo", async () => {
    vi.mocked(invites.getInviteByEventId).mockResolvedValue(null);
    vi.mocked(invites.createInvite).mockResolvedValue({ id: "inv-1", token: "tok-1", status: "pending", email_sent_at: null });
    const summary = await runPoll(NOW);
    expect(vi.mocked(invites.createInvite)).toHaveBeenCalled();
    expect(vi.mocked(google.sendGmail)).toHaveBeenCalledWith("at", "alex@example.com", expect.objectContaining({ to: "mario@acme.com" }));
    expect(vi.mocked(invites.markEmailSent)).toHaveBeenCalledWith("inv-1", expect.any(String));
    expect(summary.sent).toBe(1);
  });

  it("skips an invite that already has email_sent_at", async () => {
    vi.mocked(invites.getInviteByEventId).mockResolvedValue({ id: "inv-1", token: "tok-1", status: "completed", email_sent_at: "2026-06-01T00:00:00Z" });
    const summary = await runPoll(NOW);
    expect(vi.mocked(google.sendGmail)).not.toHaveBeenCalled();
    expect(summary.skipped).toBe(1);
  });

  it("does not mark sent when Gmail send fails", async () => {
    vi.mocked(invites.getInviteByEventId).mockResolvedValue(null);
    vi.mocked(invites.createInvite).mockResolvedValue({ id: "inv-1", token: "tok-1", status: "pending", email_sent_at: null });
    vi.mocked(google.sendGmail).mockRejectedValue(new Error("boom"));
    const summary = await runPoll(NOW);
    expect(vi.mocked(invites.markEmailSent)).not.toHaveBeenCalled();
    expect(summary.errors).toBe(1);
  });

  it("marks needs_reconsent on invalid_grant and skips the rep", async () => {
    vi.mocked(google.refreshAccessToken).mockRejectedValue(new google.InvalidGrantError());
    const summary = await runPoll(NOW);
    expect(vi.mocked(connections.markNeedsReconsent)).toHaveBeenCalledWith("alex@example.com");
    expect(vi.mocked(google.listPrimaryEvents)).not.toHaveBeenCalled();
    expect(summary.sent).toBe(0);
  });
});
