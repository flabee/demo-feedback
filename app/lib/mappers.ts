import { deriveCompany } from "@/lib/company";
import { scoreToSignal, type Signal } from "@/lib/scoring";
import type { InviteRow, ViewRow } from "@/lib/types";

const SIGNALS: Signal[] = ["hot", "warm", "cold"];

export function mapRowToViewRow(row: InviteRow): ViewRow {
  const response = row.responses?.[0] ?? null;
  const status: ViewRow["status"] =
    response || row.status === "completed" ? "completed" : "pending";

  let signal: Signal | null = null;
  if (response) {
    signal = SIGNALS.includes(response.signal as Signal)
      ? (response.signal as Signal)
      : scoreToSignal(response.score);
  }

  return {
    id: row.id,
    prospectName: row.prospect_name,
    prospectEmail: row.prospect_email,
    company: deriveCompany(row.prospect_email),
    product: row.product,
    demoOwner: row.demo_owner,
    status,
    score: response ? response.score : null,
    signal,
    nps: response ? response.nps : null,
    ratings: response
      ? {
          relevance: response.relevance,
          satisfaction: response.satisfaction,
          clarity: response.clarity,
          purchaseIntent: response.purchase_intent,
        }
      : null,
    comment: response ? response.comment : null,
    date: row.completed_at ?? row.created_at,
  };
}
