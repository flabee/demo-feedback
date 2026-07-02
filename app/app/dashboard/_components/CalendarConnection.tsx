import { auth } from "@/lib/auth";
import { getConnectionByEmail } from "@/lib/connections";
import { ConnectionCard } from "@/app/dashboard/_components/ConnectionCard";

export async function CalendarConnection() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return null;
  try {
    const conn = await getConnectionByEmail(email);
    const status =
      conn?.status === "active"
        ? "active"
        : conn?.status === "needs_reconsent"
          ? "needs_reconsent"
          : null;
    return <ConnectionCard status={status} />;
  } catch {
    // The card is purely additive — never let a connection-status lookup error
    // take down the dashboard; just hide the card.
    return null;
  }
}
