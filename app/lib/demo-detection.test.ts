import { describe, it, expect } from "vitest";
import { detectDemo } from "@/lib/demo-detection";

const opts = { internalDomain: "example.com", demoOwner: "rep@example.com" };

function ev(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt-1",
    summary: "Demo with Acme",
    description: "",
    attendees: [
      { email: "rep@example.com", self: true },
      { email: "mario@acme.com", displayName: "Mario Rossi" },
    ],
    ...overrides,
  };
}

describe("detectDemo", () => {
  it("returns a payload for a demo with an external guest", () => {
    expect(detectDemo(ev(), opts)).toEqual({
      prospect_name: "Mario Rossi",
      prospect_email: "mario@acme.com",
      product: "generic",
      demo_owner: "rep@example.com",
      calendar_event_id: "evt-1",
    });
  });

  it("returns null when there is no external guest", () => {
    expect(detectDemo(ev({ attendees: [{ email: "team@example.com" }] }), opts)).toBeNull();
  });

  it("returns null when it does not look like a demo", () => {
    expect(detectDemo(ev({ summary: "Internal sync" }), opts)).toBeNull();
  });

  it("matches 'demo' only as a whole word and labels the product 'generic'", () => {
    const r = detectDemo(ev({ summary: "Demo of our platform", description: "" }), opts);
    expect(r?.product).toBe("generic");
    expect(detectDemo(ev({ summary: "Demolition planning" }), opts)).toBeNull();
  });

  it("derives a name from the email local part when displayName is absent", () => {
    const r = detectDemo(
      ev({ attendees: [{ email: "rep@example.com", self: true }, { email: "anna.neri@umbrella.com" }] }),
      opts,
    );
    expect(r?.prospect_name).toBe("Anna Neri");
  });

  it("ignores room/resource attendees", () => {
    const r = detectDemo(
      ev({ attendees: [{ email: "room@example.com", resource: true }, { email: "p@acme.com" }] }),
      opts,
    );
    expect(r?.prospect_email).toBe("p@acme.com");
  });

  it("returns null for a cancelled event", () => {
    expect(detectDemo(ev({ status: "cancelled" }), opts)).toBeNull();
  });

  it("skips an external guest who declined the invite", () => {
    expect(
      detectDemo(
        ev({
          attendees: [
            { email: "rep@example.com", self: true },
            { email: "mario@acme.com", displayName: "Mario Rossi", responseStatus: "declined" },
          ],
        }),
        opts,
      ),
    ).toBeNull();
  });

  it("still sends when the guest hasn't responded (needsAction)", () => {
    const r = detectDemo(
      ev({
        attendees: [
          { email: "rep@example.com", self: true },
          { email: "mario@acme.com", displayName: "Mario Rossi", responseStatus: "needsAction" },
        ],
      }),
      opts,
    );
    expect(r?.prospect_email).toBe("mario@acme.com");
  });
});
