import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { exchangeCode, getUserEmail } from "@/lib/google";
import { upsertConnection } from "@/lib/connections";

export async function GET(request: Request) {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const session = await auth();
  const sessionEmail = session?.user?.email?.toLowerCase();
  if (!sessionEmail) return NextResponse.redirect(new URL("/signin", appUrl));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const parts = (jar.get("gconnect_state")?.value ?? "").split(":");
  const [savedState, savedEmail] = parts;

  const clearCookie = (res: NextResponse) => {
    res.cookies.delete("gconnect_state");
    return res;
  };

  if (!code || !state || parts.length !== 2 || state !== savedState || savedEmail !== sessionEmail) {
    return clearCookie(NextResponse.json({ error: "Invalid state" }, { status: 400 }));
  }

  const errorRedirect = (reason: string) =>
    clearCookie(NextResponse.redirect(new URL(`/dashboard?error=${reason}`, appUrl)));

  try {
    const tok = await exchangeCode(code, `${appUrl}/api/connect/google/callback`);
    if (!tok.refresh_token) return errorRedirect("norefresh");
    const grantedEmail = await getUserEmail(tok.access_token);
    // Known gap: on mismatch we redirect without revoking the freshly issued access token.
    // It self-expires (~1h); revocation is future hardening (no revoke helper yet, and this
    // path requires the user to deliberately consent a different account than their session).
    if (grantedEmail !== sessionEmail) return errorRedirect("mismatch");
    await upsertConnection(sessionEmail, tok.refresh_token, tok.scope ?? "");
  } catch {
    return errorRedirect("failed");
  }

  return clearCookie(NextResponse.redirect(new URL("/dashboard?connected=1", appUrl)));
}
