import "server-only";
import { createServerSupabase } from "@/lib/supabase";
import { encryptToken, decryptToken } from "@/lib/crypto";

const TABLE = "calendar_connections";

export type Connection = {
  email: string;
  refreshToken: string; // decrypted
  scopes: string;
  status: string;
};

export type ConnectionStatus = {
  email: string;
  scopes: string;
  status: string;
  connected_at: string;
} | null;

export async function upsertConnection(email: string, refreshToken: string, scopes: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from(TABLE).upsert(
    {
      email,
      refresh_token: encryptToken(refreshToken),
      scopes,
      status: "active",
      connected_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );
  if (error) throw new Error(`upsertConnection failed: ${error.message}`);
}

export async function getActiveConnections(): Promise<Connection[]> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("email, refresh_token, scopes, status")
    .eq("status", "active");
  if (error) throw new Error(`getActiveConnections failed: ${error.message}`);
  return (data ?? []).map((r: { email: string; refresh_token: string; scopes: string; status: string }) => ({
    email: r.email,
    refreshToken: decryptToken(r.refresh_token),
    scopes: r.scopes,
    status: r.status,
  }));
}

export async function getConnectionForSend(email: string): Promise<{ refreshToken: string } | null> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.from(TABLE).select("refresh_token, status").eq("email", email);
  if (error) throw new Error(`getConnectionForSend failed: ${error.message}`);
  const row = (data ?? [])[0] as { refresh_token: string; status: string } | undefined;
  if (!row || row.status !== "active") return null;
  return { refreshToken: decryptToken(row.refresh_token) };
}

export async function getConnectionByEmail(email: string): Promise<ConnectionStatus> {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("email, scopes, status, connected_at")
    .eq("email", email)
    .maybeSingle();
  if (error) throw new Error(`getConnectionByEmail failed: ${error.message}`);
  return (data as ConnectionStatus) ?? null;
}

export async function markNeedsReconsent(email: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from(TABLE).update({ status: "needs_reconsent" }).eq("email", email);
  if (error) throw new Error(`markNeedsReconsent failed: ${error.message}`);
}

export async function markPolled(email: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from(TABLE).update({ last_polled_at: new Date().toISOString() }).eq("email", email);
  if (error) throw new Error(`markPolled failed: ${error.message}`);
}

export async function deleteConnection(email: string): Promise<void> {
  const supabase = createServerSupabase();
  const { error } = await supabase.from(TABLE).delete().eq("email", email);
  if (error) throw new Error(`deleteConnection failed: ${error.message}`);
}
