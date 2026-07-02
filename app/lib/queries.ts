import "server-only";
import { createServerSupabase } from "@/lib/supabase";
import { mapRowToViewRow } from "@/lib/mappers";
import { applyFilters } from "@/lib/filters";
import type { Filters, InviteRow, ViewRow } from "@/lib/types";

/**
 * The single Supabase read for the dashboard. Fetches all invites with their
 * 1:1 response (left join), most recent first, maps to ViewRow, then applies
 * filters in memory. Throws on a database error (caller renders an error state).
 */
export async function getResponses(filters: Filters): Promise<ViewRow[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("invites")
    .select(
      "id, prospect_name, prospect_email, product, demo_owner, status, created_at, completed_at, responses(relevance, satisfaction, clarity, nps, purchase_intent, comment, score, signal, submitted_at)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load responses: ${error.message}`);
  }

  const rows = (data as unknown as InviteRow[]).map(mapRowToViewRow);
  return applyFilters(rows, filters);
}
