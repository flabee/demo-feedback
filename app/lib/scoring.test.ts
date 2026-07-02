import { describe, it, expect } from "vitest";
import { scoreToSignal, SIGNAL_THRESHOLDS } from "@/lib/scoring";
import { computeScore, SCORE_WEIGHTS } from "@/lib/scoring";

describe("scoreToSignal", () => {
  it("returns cold below the warm threshold", () => {
    expect(scoreToSignal(0)).toBe("cold");
    expect(scoreToSignal(49)).toBe("cold");
  });

  it("returns warm at the warm threshold and below hot", () => {
    expect(scoreToSignal(50)).toBe("warm");
    expect(scoreToSignal(74)).toBe("warm");
  });

  it("returns hot at and above the hot threshold", () => {
    expect(scoreToSignal(75)).toBe("hot");
    expect(scoreToSignal(100)).toBe("hot");
  });

  it("exposes the documented thresholds", () => {
    expect(SIGNAL_THRESHOLDS).toEqual({ hot: 75, warm: 50 });
  });
});

describe("SCORE_WEIGHTS", () => {
  it("sums to 1.0", () => {
    const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });
});

describe("computeScore", () => {
  const min = { relevance: 1, satisfaction: 1, clarity: 1, nps: 0, purchase_intent: 1 };
  const max = { relevance: 5, satisfaction: 5, clarity: 5, nps: 10, purchase_intent: 5 };
  const mid = { relevance: 3, satisfaction: 3, clarity: 3, nps: 5, purchase_intent: 3 };

  it("returns 0 for all-minimum ratings", () => {
    expect(computeScore(min)).toBe(0);
  });

  it("returns 100 for all-maximum ratings", () => {
    expect(computeScore(max)).toBe(100);
  });

  it("returns 50 for all-mid ratings", () => {
    expect(computeScore(mid)).toBe(50);
  });

  it("applies the documented weights (hand-checked example)", () => {
    // purchase 5→100*.30=30, nps 9→90*.25=22.5, satisfaction 4→75*.20=15,
    // relevance 4→75*.15=11.25, clarity 4→75*.10=7.5  => 86.25 → 86
    expect(
      computeScore({ relevance: 4, satisfaction: 4, clarity: 4, nps: 9, purchase_intent: 5 }),
    ).toBe(86);
  });
});
