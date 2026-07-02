import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteConnection } from "@/lib/connections";

export async function POST() {
  const appUrl = process.env.APP_URL ?? "";
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteConnection(email);
  return NextResponse.redirect(new URL("/dashboard?disconnected=1", appUrl));
}
