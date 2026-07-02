import { PRODUCT_KEYWORDS } from "@/lib/config";

export type CalendarAttendee = {
  email?: string;
  displayName?: string;
  resource?: boolean;
  self?: boolean;
  responseStatus?: string; // "accepted" | "declined" | "tentative" | "needsAction"
};

export type CalendarEvent = {
  id: string;
  summary?: string;
  description?: string;
  attendees?: CalendarAttendee[];
  end?: { dateTime?: string; date?: string };
  status?: string; // "confirmed" | "tentative" | "cancelled"
};

export type InvitePayload = {
  prospect_name: string;
  prospect_email: string;
  product: string;
  demo_owner: string;
  calendar_event_id: string;
};

export function isExternalGuest(email: string | undefined, internalDomain: string): boolean {
  if (typeof email !== "string" || email.length === 0) return false;
  return !email.toLowerCase().endsWith("@" + internalDomain.toLowerCase());
}

export function deduceProduct(title: string, description: string): string {
  const hay = `${title || ""} ${description || ""}`.toLowerCase();
  for (const { match, product } of PRODUCT_KEYWORDS) {
    if (hay.includes(match.toLowerCase())) return product;
  }
  return "generic";
}

export function looksLikeDemo(title: string, description: string, hasExternalGuest: boolean): boolean {
  if (!hasExternalGuest) return false;
  const hay = `${title || ""} ${description || ""}`.toLowerCase();
  return deduceProduct(title, description) !== "generic" || /\bdemo\b/.test(hay);
}

export function deriveProspectName(displayName: string | undefined, email: string): string {
  if (typeof displayName === "string" && displayName.trim() !== "") return displayName.trim();
  const localPart = String(email || "").split("@")[0];
  const words = localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return words.join(" ") || email;
}

export function pickProspect(
  attendees: CalendarAttendee[],
  internalDomain: string,
): { email: string; name: string } | null {
  for (const a of attendees) {
    if (a.resource) continue; // rooms / equipment
    if (a.responseStatus === "declined") continue; // guest said no — not a prospect to chase
    if (isExternalGuest(a.email, internalDomain)) {
      return { email: a.email as string, name: deriveProspectName(a.displayName, a.email as string) };
    }
  }
  return null;
}

export function detectDemo(
  event: CalendarEvent,
  { internalDomain, demoOwner }: { internalDomain: string; demoOwner: string },
): InvitePayload | null {
  if (event.status === "cancelled") return null; // the demo isn't happening
  const prospect = pickProspect(event.attendees ?? [], internalDomain);
  const title = event.summary ?? "";
  const description = event.description ?? "";
  if (!looksLikeDemo(title, description, prospect !== null)) return null;
  return {
    prospect_name: prospect!.name,
    prospect_email: prospect!.email,
    product: deduceProduct(title, description),
    demo_owner: demoOwner,
    calendar_event_id: event.id,
  };
}
