import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/app/_components/Logo";

export async function DashboardHeader() {
  const session = await auth();
  return (
    <header className="mb-8">
      <div className="flex items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <Logo height={26} priority />
        <div className="flex items-center gap-3 text-sm">
          {session?.user?.email && (
            <span className="hidden text-gray-500 sm:inline">{session.user.email}</span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/signin" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-gray-200 px-3 py-1.5 font-medium text-gray-600 transition-colors hover:border-brand/40 hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="mt-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-gray-900">
          Sales Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">Post-demo feedback</p>
      </div>
    </header>
  );
}
