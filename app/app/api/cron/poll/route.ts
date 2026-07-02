import { NextResponse } from "next/server";
import { checkSecret } from "@/lib/trigger";
import { runPoll } from "@/lib/poll";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  if (!checkSecret(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runPoll(Date.now());
    return NextResponse.json({ ok: true, ...summary });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
