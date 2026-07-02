import "server-only";
import { createServerSupabase } from "@/lib/supabase";

export type InviteLookup = {
  id: string;
  product: string;
  prospect_name: string;
  status: string;
  demo_owner: string;
  company: string | null;
};

/** Look up an invite by its public token. Returns null if not found. */
export async function getInviteByToken(token: string): Promise<InviteLookup | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("invites")
    .select("id, product, prospect_name, status, demo_owner, company")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(`Invite lookup failed: ${error.message}`);
  return (data as InviteLookup) ?? null;
}

/** Thrown when a response already exists for the invite (unique violation). */
export class DuplicateResponseError extends Error {
  constructor() {
    super("A response already exists for this invite");
    this.name = "DuplicateResponseError";
  }
}

export async function insertResponse(row: Record<string, unknown>): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from("responses").insert(row);
  if (error) {
    // 23505 = Postgres unique_violation (responses.invite_id is unique).
    if (error.code === "23505") throw new DuplicateResponseError();
    throw new Error(`Response insert failed: ${error.message}`);
  }
}

export async function markCompleted(inviteId: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("invites")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", inviteId);
  if (error) throw new Error(`Invite update failed: ${error.message}`);
}

export type NewInvite = {
  token: string;
  calendar_event_id: string;
  prospect_name: string;
  prospect_email: string;
  product: string;
  demo_owner: string;
};

export type InviteRecord = {
  id: string;
  token: string;
  status: string;
  email_sent_at: string | null;
};

/** Thrown when an invite already exists for the calendar event (unique violation). */
export class DuplicateInviteError extends Error {
  constructor() {
    super("An invite already exists for this calendar event");
    this.name = "DuplicateInviteError";
  }
}

export async function getInviteByEventId(
  calendarEventId: string,
): Promise<InviteRecord | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("invites")
    .select("id, token, status, email_sent_at")
    .eq("calendar_event_id", calendarEventId)
    .maybeSingle();
  if (error) throw new Error(`Invite lookup failed: ${error.message}`);
  return (data as InviteRecord) ?? null;
}

export async function createInvite(invite: NewInvite): Promise<InviteRecord> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("invites")
    .insert({ ...invite, status: "pending" })
    .select("id, token, status, email_sent_at")
    .single();
  if (error) {
    if (error.code === "23505") throw new DuplicateInviteError();
    throw new Error(`Invite create failed: ${error.message}`);
  }
  return data as InviteRecord;
}

export async function markEmailSent(inviteId: string, iso: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase
    .from("invites")
    .update({ email_sent_at: iso })
    .eq("id", inviteId);
  if (error) throw new Error(`markEmailSent failed: ${error.message}`);
}
