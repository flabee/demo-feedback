"use client";

import { useEffect } from "react";
import type { ViewRow } from "@/lib/types";
import { SignalBadge } from "@/app/dashboard/_components/SignalBadge";

function Rating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 py-2 text-sm last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className="tabular-nums font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export function DetailDrawer({
  row,
  onClose,
}: {
  row: ViewRow | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [row, onClose]);

  if (!row) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`Feedback from ${row.prospectName}`}>
      <div
        className="absolute inset-0 bg-gray-900/30 motion-safe:animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="relative z-50 h-full w-full max-w-md overflow-y-auto rounded-l-2xl bg-white p-6 shadow-2xl shadow-gray-900/20 motion-safe:animate-drawer-in">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-gray-900">
              {row.prospectName}
            </h2>
            <p className="text-sm text-gray-500">{row.prospectEmail}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-tint hover:text-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div><dt className="text-gray-500">Company</dt><dd className="font-medium text-gray-900">{row.company ?? "—"}</dd></div>
          <div><dt className="text-gray-500">Product</dt><dd className="font-medium text-gray-900">{row.product}</dd></div>
          <div><dt className="text-gray-500">Owner</dt><dd className="font-medium text-gray-900">{row.demoOwner}</dd></div>
          <div><dt className="mb-1 text-gray-500">Signal</dt><dd><SignalBadge signal={row.signal} /></dd></div>
        </dl>

        {row.status === "pending" || !row.ratings ? (
          <p className="rounded-xl bg-brand-tint/50 p-4 text-sm text-gray-600">
            Awaiting feedback — this prospect has not submitted the form yet.
          </p>
        ) : (
          <>
            <div className="mb-5 rounded-xl border border-gray-100 px-4 py-1">
              <Rating label="Relevance" value={row.ratings.relevance} />
              <Rating label="Satisfaction" value={row.ratings.satisfaction} />
              <Rating label="Clarity" value={row.ratings.clarity} />
              <Rating label="Purchase intent" value={row.ratings.purchaseIntent} />
              <Rating label="NPS" value={row.nps ?? 0} />
              <Rating label="Score" value={row.score ?? 0} />
            </div>
            {row.comment && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Comment</h3>
                <p className="rounded-xl bg-gray-50 p-3.5 text-sm leading-relaxed text-gray-700">
                  {row.comment}
                </p>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
