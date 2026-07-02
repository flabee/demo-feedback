import { getInviteByToken } from "@/lib/invites";
import { FeedbackForm } from "@/app/form/_components/FeedbackForm";
import { Logo } from "@/app/_components/Logo";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-tint/40 px-4 py-10 font-body sm:py-16">
      <div className="w-full max-w-lg">{children}</div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <section className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-900/5 sm:p-10">
        <div className="flex justify-center">
          <Logo height={26} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-gray-600">
          {body}
        </p>
      </section>
    </Shell>
  );
}

export default async function FormPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = typeof params.t === "string" ? params.t : "";

  if (!token) {
    return <Message title="Invalid link" body="This link is invalid or has expired." />;
  }

  let invite;
  try {
    invite = await getInviteByToken(token);
  } catch {
    return <Message title="Error" body="Something went wrong. Please try again later." />;
  }

  if (!invite) {
    return <Message title="Invalid link" body="This link is invalid or has expired." />;
  }
  if (invite.status === "completed") {
    return <Message title="Thank you!" body="You've already submitted your feedback." />;
  }

  return (
    <Shell>
      <FeedbackForm token={token} prospectName={invite.prospect_name} product={invite.product} />
    </Shell>
  );
}
