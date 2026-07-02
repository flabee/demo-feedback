import { signIn } from "@/lib/auth";
import { Logo } from "@/app/_components/Logo";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-tint/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <section className="rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-xl shadow-gray-900/5 sm:p-10">
          <div className="flex justify-center">
            <Logo height={30} priority />
          </div>
          <h1 className="mt-7 font-display text-2xl font-semibold tracking-tight text-gray-900">
            Sales Dashboard
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-gray-600">
            Sign in with your work Google account to view demo feedback.
          </p>
          <form
            className="mt-8"
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard" });
            }}
          >
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-brand text-[15px] font-semibold text-white shadow-sm shadow-brand/25 transition-[background-color,transform] duration-150 ease-out hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 motion-safe:active:scale-[0.99]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.66Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.96-1.08 7.95-2.91l-3.88-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A12 12 0 0 0 12 24Z" />
                  <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.28a12 12 0 0 0 0 10.76l3.99-3.09Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.99 11.99 0 0 0 1.28 6.62l3.99 3.09C6.22 6.86 8.87 4.75 12 4.75Z" />
                </svg>
              </span>
              Sign in with Google
            </button>
          </form>
        </section>
        <p className="mt-5 text-center text-xs text-gray-500">
          Access restricted to your team.
        </p>
      </div>
    </main>
  );
}
