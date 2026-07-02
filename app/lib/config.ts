// Central template configuration. Every value has a sensible default and can be
// overridden with an environment variable — this is the one file most adopters
// need to touch to make the app their own.

/**
 * Restrict dashboard login to a single email domain, e.g. "acme.com".
 * Leave empty to allow any verified Google account (not recommended for a
 * real sales dashboard). Set via COMPANY_EMAIL_DOMAIN.
 */
export const COMPANY_EMAIL_DOMAIN = (process.env.COMPANY_EMAIL_DOMAIN ?? "").toLowerCase().trim();

/**
 * Product / brand name shown in the UI, the logo wordmark, and outgoing emails.
 * Set via NEXT_PUBLIC_APP_NAME (must be NEXT_PUBLIC_ so it reaches the browser).
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Demo Feedback";

/**
 * Keyword → product-name map used to label a demo from its calendar event title.
 * Empty by default: every demo is labeled "generic" and detection relies on the
 * word "demo" appearing in the event title. Add your own products here, e.g.
 *   { match: "acme", product: "Acme" }
 * (the `match` is lower-cased and compared against title + description).
 */
export const PRODUCT_KEYWORDS: { match: string; product: string }[] = [];
