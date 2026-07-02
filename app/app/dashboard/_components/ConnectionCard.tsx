export function ConnectionCard({ status }: { status: "active" | "needs_reconsent" | null }) {
  const connected = status === "active";
  return (
    <section className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/5">
      <div>
        <h2 className="font-display text-sm font-semibold text-gray-900">Google Calendar</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          {connected
            ? "Connected — feedback emails go out automatically after your demos."
            : status === "needs_reconsent"
              ? "Access expired: reconnect your account to resume sending."
              : "Connect your account to send feedback requests automatically."}
        </p>
      </div>
      {connected ? (
        <form action="/api/connect/google/disconnect" method="post">
          <button
            type="submit"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-brand/40 hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Disconnect
          </button>
        </form>
      ) : (
        <a
          href="/api/connect/google/start"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand/25 transition-colors hover:bg-brand-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2"
        >
          {status === "needs_reconsent" ? "Reconnect Google Calendar" : "Connect Google Calendar"}
        </a>
      )}
    </section>
  );
}
