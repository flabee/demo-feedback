import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/connections", () => ({ getConnectionForSend: vi.fn() }));
vi.mock("@/lib/google", () => ({ refreshAccessToken: vi.fn(), sendGmail: vi.fn() }));
vi.mock("@/lib/email", () => ({
  buildNotificationEmail: vi.fn(() => ({ subject: "s", html: "h", text: "t" })),
}));

import { notifyFeedback } from "@/lib/notify";
import * as connections from "@/lib/connections";
import * as google from "@/lib/google";
import * as email from "@/lib/email";

const input = {
  demoOwner: "alex@example.com",
  prospectName: "Mario",
  company: "ACME",
  product: "Acme",
  score: 88,
  signal: "hot" as const,
  comment: "ottimo",
};

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("APP_URL", "https://app.example.com");
  vi.mocked(connections.getConnectionForSend).mockReset();
  vi.mocked(google.refreshAccessToken).mockReset();
  vi.mocked(google.sendGmail).mockReset().mockResolvedValue();
});

describe("notifyFeedback", () => {
  it("sends the notification from the demo owner's account to themselves", async () => {
    vi.mocked(connections.getConnectionForSend).mockResolvedValue({ refreshToken: "rt" });
    vi.mocked(google.refreshAccessToken).mockResolvedValue("at");
    await notifyFeedback(input);
    expect(vi.mocked(google.sendGmail)).toHaveBeenCalledWith(
      "at",
      "alex@example.com",
      expect.objectContaining({ to: "alex@example.com", subject: "s" }),
      expect.objectContaining({ signal: expect.anything() }),
    );
    expect(vi.mocked(email.buildNotificationEmail).mock.calls[0][0]).toMatchObject({
      dashboardUrl: "https://app.example.com/dashboard",
      prospectName: "Mario",
      product: "Acme",
      score: 88,
    });
  });

  it("skips when APP_URL is not set", async () => {
    vi.stubEnv("APP_URL", "");
    await notifyFeedback(input);
    expect(vi.mocked(connections.getConnectionForSend)).not.toHaveBeenCalled();
    expect(vi.mocked(google.sendGmail)).not.toHaveBeenCalled();
  });

  it("skips silently when the demo owner isn't connected", async () => {
    vi.mocked(connections.getConnectionForSend).mockResolvedValue(null);
    await notifyFeedback(input);
    expect(vi.mocked(google.sendGmail)).not.toHaveBeenCalled();
  });

  it("never throws when refresh or send fails", async () => {
    vi.mocked(connections.getConnectionForSend).mockResolvedValue({ refreshToken: "rt" });
    vi.mocked(google.refreshAccessToken).mockRejectedValue(new Error("boom"));
    await expect(notifyFeedback(input)).resolves.toBeUndefined();
  });
});
