const GENERIC_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com",
  "live.com", "yahoo.com", "icloud.com", "me.com", "proton.me",
  "protonmail.com", "gmx.com", "aol.com", "yandex.com",
]);

const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

/**
 * Derives a display company label from a prospect's email domain.
 * Returns null for generic providers or malformed input.
 */
export function deriveCompany(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;

  const domain = email.slice(at + 1).toLowerCase().trim();
  if (!domain.includes(".")) return null;
  if (GENERIC_PROVIDERS.has(domain)) return null;

  const parts = domain.split(".");
  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  // e.g. acme.co.uk → take "acme"
  const label =
    parts.length >= 3 && last.length === 2 && SECOND_LEVEL.has(secondLast)
      ? parts[parts.length - 3]
      : secondLast;

  if (!label) return null;
  return label.charAt(0).toUpperCase() + label.slice(1);
}
