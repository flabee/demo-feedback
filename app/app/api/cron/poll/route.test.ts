import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/poll", () => ({ runPoll: vi.fn() }));

import { POST } from "@/app/api/cron/poll/route";
import * as poll from "@/lib/poll";

const SECRET = "cronsecret";
function req(auth: string | null = `Bearer ${SECRET}`): Request {
  const headers: Record<string, string> = {};
  if (auth) headers["authorization"] = auth;
  return new Request("http://localhost/api/cron/poll", { method: "POST", headers });
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv("CRON_SECRET", SECRET);
  vi.mocked(poll.runPoll).mockReset();
});

describe("POST /api/cron/poll", () => {
  it("500 when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await POST(req())).status).toBe(500);
  });

  it("401 for a missing/wrong secret", async () => {
    expect((await POST(req("Bearer nope"))).status).toBe(401);
    expect((await POST(req(null))).status).toBe(401);
    expect(vi.mocked(poll.runPoll)).not.toHaveBeenCalled();
  });

  it("runs the poll and returns the summary", async () => {
    vi.mocked(poll.runPoll).mockResolvedValue({ connections: 2, sent: 1, skipped: 1, errors: 0 });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, connections: 2, sent: 1 });
  });

  it("returns 500 when the poll throws", async () => {
    vi.mocked(poll.runPoll).mockRejectedValue(new Error("APP_URL is not set"));
    expect((await POST(req())).status).toBe(500);
  });
});
