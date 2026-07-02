import type {
  Filters, PeriodFilter, SignalFilter, ViewRow,
} from "@/lib/types";

type Params = Record<string, string | string[] | undefined>;

const SIGNALS: SignalFilter[] = ["hot", "warm", "cold", "pending", "all"];
const PERIODS: PeriodFilter[] = ["7d", "30d", "90d", "all"];
const PERIOD_DAYS: Record<Exclude<PeriodFilter, "all">, number> = {
  "7d": 7, "30d": 30, "90d": 90,
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseFilters(params: Params): Filters {
  const signalRaw = first(params.signal);
  const periodRaw = first(params.period);
  const productRaw = first(params.product);
  const qRaw = first(params.q);

  return {
    signal: SIGNALS.includes(signalRaw as SignalFilter)
      ? (signalRaw as SignalFilter)
      : "all",
    product: productRaw && productRaw.length > 0 ? productRaw : "all",
    period: PERIODS.includes(periodRaw as PeriodFilter)
      ? (periodRaw as PeriodFilter)
      : "all",
    q: qRaw?.trim() ?? "",
  };
}

export function applyFilters(
  rows: ViewRow[],
  filters: Filters,
  now: Date = new Date(),
): ViewRow[] {
  return rows.filter((row) => {
    if (filters.signal === "pending") {
      if (row.status !== "pending") return false;
    } else if (filters.signal !== "all") {
      if (row.signal !== filters.signal) return false;
    }

    if (filters.product !== "all" && row.product !== filters.product) {
      return false;
    }

    if (filters.period !== "all") {
      const cutoff = now.getTime() - PERIOD_DAYS[filters.period] * 86_400_000;
      if (new Date(row.date).getTime() < cutoff) return false;
    }

    if (filters.q) {
      const needle = filters.q.toLowerCase();
      // Company is derived from the email domain, so include it too: searching
      // "acme" matches both mario@acme.com and the derived "Acme" label.
      const haystack =
        `${row.prospectName} ${row.prospectEmail} ${row.company ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}
