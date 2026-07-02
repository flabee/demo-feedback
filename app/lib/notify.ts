import "server-only";
import { getConnectionForSend } from "@/lib/connections";
import { refreshAccessToken, sendGmail } from "@/lib/google";
import { buildNotificationEmail } from "@/lib/email";
import type { Signal } from "@/lib/scoring";

const TIMEOUT_MS = 4000;

export type NotifyFeedbackInput = {
  demoOwner: string;
  prospectName: string;
  company: string | null;
  product: string;
  score: number;
  signal: Signal;
  comment?: string | null;
};

/**
 * Best-effort: email the demo owner (from their own Gmail) that a prospect
 * completed the form. Never throws — a failure must not affect the submit.
 */
export async function notifyFeedback(input: NotifyFeedbackInput): Promise<void> {
  try {
    const appUrl = process.env.APP_URL;
    if (!appUrl) {
      console.log("[notify] APP_URL not set — skipping notification for", input.demoOwner);
      return;
    }
    const conn = await getConnectionForSend(input.demoOwner);
    if (!conn) {
      console.log("[notify] no active connection for", input.demoOwner, "— skipping");
      return;
    }
    // The 4s abort bounds the network-heavy Google calls; the Supabase lookup
    // above is expected to be fast (Supabase applies its own connection timeouts).
    const abortSignal = AbortSignal.timeout(TIMEOUT_MS);
    const accessToken = await refreshAccessToken(conn.refreshToken, { signal: abortSignal });
    const { subject, html, text } = buildNotificationEmail({
      prospectName: input.prospectName,
      company: input.company,
      product: input.product,
      score: input.score,
      signal: input.signal,
      comment: input.comment ?? null,
      dashboardUrl: `${appUrl}/dashboard`,
    });
    await sendGmail(accessToken, input.demoOwner, { to: input.demoOwner, subject, html, text }, { signal: abortSignal });
  } catch (e) {
    console.error("[notify] feedback notification failed for", input.demoOwner, e);
  }
}
