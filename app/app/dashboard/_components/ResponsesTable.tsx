"use client";

import { useState } from "react";
import type { ViewRow } from "@/lib/types";
import { SignalBadge } from "@/app/dashboard/_components/SignalBadge";
import { DetailDrawer } from "@/app/dashboard/_components/DetailDrawer";

function formatDate(iso: string): string {
  // Renders the UTC calendar date (YYYY-MM-DD). Acceptable for this internal
  // tool; viewer-local timezone is not applied.
  return iso.slice(0, 10);
}

export function ResponsesTable({ rows }: { rows: ViewRow[] }) {
  const [selected, setSelected] = useState<ViewRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-500">
        No prospects match these filters.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">NPS</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selected?.id === row.id;
              return (
                <tr
                  key={row.id}
                  tabIndex={0}
                  onClick={() => setSelected(row)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelected(row);
                    }
                  }}
                  className={`cursor-pointer border-b border-gray-100 outline-none transition-colors last:border-0 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 ${
                    isSelected ? "bg-brand-tint" : "hover:bg-brand-tint/50"
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">{row.prospectName}</td>
                  <td className="px-4 py-3 text-gray-600">{row.company ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{row.product}</td>
                  <td className="px-4 py-3 text-gray-600">{row.demoOwner}</td>
                  <td className="px-4 py-3 tabular-nums font-medium text-gray-900">{row.score ?? "—"}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{row.nps ?? "—"}</td>
                  <td className="px-4 py-3"><SignalBadge signal={row.signal} /></td>
                  <td className="px-4 py-3 capitalize text-gray-600">{row.status}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-500">{formatDate(row.date)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <DetailDrawer row={selected} onClose={() => setSelected(null)} />
    </>
  );
}
