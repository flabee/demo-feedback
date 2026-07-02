import { getResponses } from "@/lib/queries";
import { parseFilters } from "@/lib/filters";
import { DashboardHeader } from "@/app/dashboard/_components/DashboardHeader";
import { CalendarConnection } from "@/app/dashboard/_components/CalendarConnection";
import { FilterBar } from "@/app/dashboard/_components/FilterBar";
import { ResponsesTable } from "@/app/dashboard/_components/ResponsesTable";
import type { ViewRow } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = parseFilters(await searchParams);

  let rows: ViewRow[] = [];
  let error: string | null = null;
  try {
    rows = await getResponses(filters);
  } catch {
    error = "Could not load feedback data. Please try again later.";
  }

  // Product options are derived from the currently-filtered rows. This is an
  // intentional first-version simplification: a narrow filter can hide some
  // product options. A distinct-products query is a future improvement.
  const products = Array.from(new Set(rows.map((r) => r.product))).sort();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <DashboardHeader />
      <CalendarConnection />
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <FilterBar filters={filters} products={products} />
          <ResponsesTable rows={rows} />
        </>
      )}
    </main>
  );
}
