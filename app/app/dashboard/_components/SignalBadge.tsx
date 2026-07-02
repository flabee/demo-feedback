import type { Signal } from "@/lib/scoring";

const STYLES: Record<Signal | "pending", string> = {
  hot: "bg-red-100 text-red-800",
  warm: "bg-amber-100 text-amber-800",
  cold: "bg-sky-100 text-sky-800",
  pending: "bg-gray-100 text-gray-600",
};

export function SignalBadge({ signal }: { signal: Signal | null }) {
  const key = signal ?? "pending";
  const label = signal ?? "pending";
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium uppercase ${STYLES[key]}`}
    >
      {label}
    </span>
  );
}
