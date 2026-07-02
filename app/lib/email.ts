import "server-only";
import { APP_NAME } from "@/lib/config";

/** Escape user-derived values before interpolating into the HTML body. */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = "#4F46E5";

/** Small text wordmark used in place of a hosted logo image, so emails need no assets. */
function wordmark(size = 18): string {
  return `<span style="font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:${size}px;letter-spacing:-0.01em;color:${BRAND}">${esc(APP_NAME)}</span>`;
}

/** Pure builder for the on-brand feedback request email sent to a prospect. */
export function buildEmail({
  prospectName,
  product,
  formUrl,
}: {
  prospectName: string;
  product: string;
  formUrl: string;
}): { subject: string; html: string; text: string } {
  const subject = `How did the ${product} demo go?`;
  const safeName = esc(prospectName);
  const safeProduct = esc(product);
  const safeUrl = esc(formUrl);
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#111">
    <p style="margin:0 0 24px">${wordmark()}</p>
    <h1 style="font-size:20px">Hi ${safeName} 👋</h1>
    <p style="font-size:14px;line-height:1.5;color:#444">
      Thanks for joining the <strong>${safeProduct}</strong> demo.
      Would you help us with some quick feedback? It only takes two minutes.
    </p>
    <p style="text-align:center;margin:28px 0">
      <a href="${safeUrl}"
         style="background:${BRAND};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block">
        Leave your feedback
      </a>
    </p>
    <p style="font-size:12px;color:#888">
      If the button doesn't work, copy this link:<br>${safeUrl}
    </p>
  </div>`;
  const text = `Hi ${prospectName},\n\nThanks for joining the ${product} demo. Would you help us with some quick feedback? It only takes two minutes:\n\n${formUrl}\n\nThanks,\n${APP_NAME}`;
  return { subject, html, text };
}

const SIGNAL_COLOR: Record<string, string> = { hot: "#EF4444", warm: "#F59E0B", cold: "#0EA5E9" };

/** Internal notification to the demo owner that a prospect completed the form. */
export function buildNotificationEmail({
  prospectName,
  company,
  product,
  score,
  signal,
  comment,
  dashboardUrl,
}: {
  prospectName: string;
  company: string | null;
  product: string;
  score: number;
  signal: string;
  comment: string | null;
  dashboardUrl: string;
}): { subject: string; html: string; text: string } {
  const safeName = esc(prospectName);
  const safeCompany = company ? esc(company) : "";
  const safeProduct = esc(product);
  const trimmed = comment && comment.trim() ? comment.trim() : "";
  const safeComment = trimmed ? esc(trimmed) : "";
  const color = SIGNAL_COLOR[signal] ?? BRAND;
  const who = safeCompany ? `${safeName} · ${safeCompany}` : safeName;
  const subject = `New feedback: ${prospectName}${company ? " · " + company : ""} · ${product} · ${signal.toUpperCase()}`;

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#141322">
    <p style="margin:0 0 20px">${wordmark(16)}</p>
    <h1 style="font-size:19px;margin:0 0 4px">New feedback received</h1>
    <p style="font-size:14px;color:#6b6b7b;margin:0 0 18px">${who} — ${safeProduct} demo</p>
    <table role="presentation" style="border-collapse:collapse;margin:0 0 18px">
      <tr>
        <td style="padding:0 20px 0 0;vertical-align:middle">
          <div style="font-size:12px;color:#6b6b7b">Score</div>
          <div style="font-size:26px;font-weight:700;color:#141322">${score}</div>
        </td>
        <td style="vertical-align:middle">
          <span style="display:inline-block;background:${color};color:#fff;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;padding:5px 12px;border-radius:999px">${esc(signal)}</span>
        </td>
      </tr>
    </table>
    ${safeComment ? `<p style="font-size:14px;color:#141322;background:#f7f7fc;border-radius:10px;padding:12px 14px;margin:0 0 20px">&ldquo;${safeComment}&rdquo;</p>` : ""}
    <p style="margin:0">
      <a href="${dashboardUrl}" style="background:${BRAND};color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px;font-size:14px;font-weight:600;display:inline-block">Open the dashboard</a>
    </p>
  </div>`;

  const text = `New feedback: ${prospectName}${company ? " · " + company : ""}\nDemo: ${product}\nScore: ${score} (${signal})\n${trimmed ? `Comment: ${trimmed}\n` : ""}\nOpen the dashboard: ${dashboardUrl}`;
  return { subject, html, text };
}
