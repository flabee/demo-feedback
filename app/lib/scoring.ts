export const SIGNAL_THRESHOLDS = { hot: 75, warm: 50 } as const;

export type Signal = "hot" | "warm" | "cold";

/** Maps a 0–100 score to a commercial signal. Mirrors docs/scoring.md. */
export function scoreToSignal(score: number): Signal {
  if (score >= SIGNAL_THRESHOLDS.hot) return "hot";
  if (score >= SIGNAL_THRESHOLDS.warm) return "warm";
  return "cold";
}

export const SCORE_WEIGHTS = {
  purchase_intent: 0.3,
  nps: 0.25,
  satisfaction: 0.2,
  relevance: 0.15,
  clarity: 0.1,
} as const;

export type Ratings = {
  relevance: number; // 1–5
  satisfaction: number; // 1–5
  clarity: number; // 1–5
  nps: number; // 0–10
  purchase_intent: number; // 1–5
};

const norm5 = (v: number): number => ((v - 1) / 4) * 100;
const norm10 = (v: number): number => (v / 10) * 100;

/** Weighted 0–100 score from the five inputs. Mirrors docs/scoring.md. */
export function computeScore(r: Ratings): number {
  const score =
    norm5(r.purchase_intent) * SCORE_WEIGHTS.purchase_intent +
    norm10(r.nps) * SCORE_WEIGHTS.nps +
    norm5(r.satisfaction) * SCORE_WEIGHTS.satisfaction +
    norm5(r.relevance) * SCORE_WEIGHTS.relevance +
    norm5(r.clarity) * SCORE_WEIGHTS.clarity;
  return Math.round(score);
}
