export default function Loading() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
        <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="mb-8 mt-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mb-5 h-10 w-full animate-pulse rounded-lg bg-gray-100" />
      <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-100" />
    </main>
  );
}
