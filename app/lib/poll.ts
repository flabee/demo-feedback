import "server-only";
import { getActiveConnections, markNeedsReconsent, markPolled } from "@/lib/connections";
import { refreshAccessToken, listPrimaryEvents, sendGmail, InvalidGrantError } from "@/lib/google";
import { detectDemo } from "@/lib/demo-detection";
import { getInviteByEventId, createInvite, markEmailSent, DuplicateInviteError } from "@/lib/invites";
import { generateToken } from "@/lib/trigger";
import { buildEmail } from "@/lib/email";

const WINDOW_MS = 2 * 60 * 60 * 1000; // consider demos that ended in the last 2h

export type PollSummary = { connections: number; sent: number; skipped: number; errors: number };

export async function runPoll(nowMs: number): Promise<PollSummary> {
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL is not set");

  const activeConnections = await getActiveConnections();
  const timeMin = new Date(nowMs - WINDOW_MS).toISOString();
  const timeMax = new Date(nowMs).toISOString();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  for (const conn of activeConnections) {
    try {
      let accessToken: string;
      try {
        accessToken = await refreshAccessToken(conn.refreshToken);
      } catch (e) {
        if (e instanceof InvalidGrantError) {
          await markNeedsReconsent(conn.email);
          errors++;
          continue;
        }
        throw e;
      }

      // The rep's own email domain is "internal"; every other attendee is a
      // prospect. This is why logins are domain-restricted (see lib/config.ts).
      const internalDomain = conn.email.split("@")[1] ?? "";

      const events = await listPrimaryEvents(accessToken, timeMin, timeMax);
      for (const event of events) {
        // Only timed meetings have a meaningful "ended" moment for post-demo feedback;
        // all-day events (which carry end.date, not end.dateTime) are intentionally skipped.
        const endMs = event.end?.dateTime ? Date.parse(event.end.dateTime) : NaN;
        if (Number.isNaN(endMs) || endMs > nowMs || endMs < nowMs - WINDOW_MS) continue;

        const payload = detectDemo(event, { internalDomain, demoOwner: conn.email });
        if (!payload) continue;

        let invite = await getInviteByEventId(payload.calendar_event_id);
        if (invite?.email_sent_at) {
          skipped++;
          continue;
        }
        if (!invite) {
          try {
            invite = await createInvite({ token: generateToken(), ...payload });
          } catch (e) {
            if (e instanceof DuplicateInviteError) {
              invite = await getInviteByEventId(payload.calendar_event_id);
              if (!invite || invite.email_sent_at) {
                skipped++;
                continue;
              }
            } else {
              throw e;
            }
          }
        }

        const formUrl = `${appUrl}/form?t=${invite.token}`;
        const { subject, html, text } = buildEmail({
          prospectName: payload.prospect_name,
          product: payload.product,
          formUrl,
        });
        try {
          await sendGmail(accessToken, conn.email, { to: payload.prospect_email, subject, html, text });
          await markEmailSent(invite.id, new Date(nowMs).toISOString());
          sent++;
        } catch (e) {
          console.error("[poll] Gmail send failed for", conn.email, event.id, e);
          errors++;
        }
      }
      await markPolled(conn.email);
    } catch (e) {
      console.error("[poll] rep poll failed for", conn.email, e);
      errors++;
    }
  }

  return { connections: activeConnections.length, sent, skipped, errors };
}
