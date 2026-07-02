"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Filters } from "@/lib/types";

const SIGNAL_OPTIONS = ["all", "hot", "warm", "cold", "pending"] as const;
const SIGNAL_DOT: Record<string, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-sky-500",
  pending: "bg-gray-400",
};

const PERIOD_LABELS: Record<Filters["period"], string> = {
  all: "All time",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

const SELECT =
  "h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-sm font-medium text-gray-700 transition-colors hover:border-gray-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

function Chevron() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
    >
      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FilterBar({
  filters,
  products,
}: {
  filters: Filters;
  products: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.signal !== "all") params.set("signal", next.signal);
    if (next.product !== "all") params.set("product", next.product);
    if (next.period !== "all") params.set("period", next.period);
    if (next.q) params.set("q", next.q);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const hasActiveFilters =
    filters.signal !== "all" ||
    filters.product !== "all" ||
    filters.period !== "all" ||
    Boolean(filters.q);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm shadow-gray-900/5">
      {/* Signal — segmented control mirroring the badge colors */}
      <div
        role="radiogroup"
        aria-label="Signal"
        className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5"
      >
        {SIGNAL_OPTIONS.map((s) => {
          const active = filters.signal === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update({ signal: s })}
              className={`flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {SIGNAL_DOT[s] && (
                <span className={`h-1.5 w-1.5 rounded-full ${SIGNAL_DOT[s]}`} aria-hidden="true" />
              )}
              {s}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <select
          aria-label="Product"
          value={filters.product}
          onChange={(e) => update({ product: e.target.value })}
          className={SELECT}
        >
          <option value="all">All products</option>
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className="relative">
        <select
          aria-label="Period"
          value={filters.period}
          onChange={(e) => update({ period: e.target.value as Filters["period"] })}
          className={SELECT}
        >
          {(Object.keys(PERIOD_LABELS) as Filters["period"][]).map((p) => (
            <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
          ))}
        </select>
        <Chevron />
      </div>

      <div className="relative min-w-[12rem] flex-1">
        <svg
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
          <path d="m17 17-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <input
          key={`q-${filters.q}`}
          aria-label="Search"
          type="search"
          defaultValue={filters.q}
          placeholder="Search name, email, company…"
          onKeyDown={(e) => {
            if (e.key === "Enter") update({ q: (e.target as HTMLInputElement).value });
          }}
          className="h-9 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="h-9 rounded-lg px-3 text-sm font-medium text-gray-500 transition-colors hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          Clear
        </button>
      )}
    </div>
  );
}
