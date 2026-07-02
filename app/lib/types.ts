import type { Signal } from "@/lib/scoring";

/** Raw shape returned by the Supabase invites query (responses nested 1:1). */
export type InviteRow = {
  id: string;
  prospect_name: string;
  prospect_email: string;
  product: string;
  demo_owner: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  responses: ResponseRow[] | null;
};

export type ResponseRow = {
  relevance: number;
  satisfaction: number;
  clarity: number;
  nps: number;
  purchase_intent: number;
  comment: string | null;
  score: number;
  signal: string;
  submitted_at: string;
};

/** Flat row consumed by the dashboard UI. */
export type ViewRow = {
  id: string;
  prospectName: string;
  prospectEmail: string;
  company: string | null;
  product: string;
  demoOwner: string;
  status: "pending" | "completed";
  score: number | null;
  signal: Signal | null;
  nps: number | null;
  ratings: {
    relevance: number;
    satisfaction: number;
    clarity: number;
    purchaseIntent: number;
  } | null;
  comment: string | null;
  date: string; // completed_at ?? created_at
};

export type SignalFilter = Signal | "pending" | "all";
export type PeriodFilter = "7d" | "30d" | "90d" | "all";

export type Filters = {
  signal: SignalFilter;
  product: string | "all";
  period: PeriodFilter;
  q: string;
};

export type SubmissionPayload = {
  token: string;
  relevance: number; // 1–5
  satisfaction: number; // 1–5
  clarity: number; // 1–5
  nps: number; // 0–10
  purchase_intent: number; // 1–5
  comment?: string;
};
