"use client";

export function RatingScale({
  value,
  onChange,
  min,
  max,
  ariaLabel,
}: {
  value: number | null;
  onChange: (v: number) => void;
  min: number;
  max: number;
  ariaLabel: string;
}) {
  const options: number[] = [];
  for (let i = min; i <= max; i++) options.push(i);
  // A wide scale (the 0–10 NPS) gets a fixed grid so buttons stay equal and the
  // last row never stretches; short scales (1–5) fill one row.
  const wide = options.length > 6;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`grid gap-1.5 ${wide ? "grid-cols-6 sm:grid-cols-11" : ""}`}
      style={wide ? undefined : { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(n)}
            className={[
              "h-11 rounded-xl text-sm font-semibold tabular-nums",
              "transition-[color,background-color,border-color,transform,box-shadow] duration-150 ease-out",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              "motion-safe:active:scale-95",
              selected
                ? "border border-brand bg-brand text-white shadow-sm shadow-brand/25"
                : "border border-gray-200 bg-white text-gray-600 hover:border-brand/40 hover:bg-brand-tint hover:text-brand",
            ].join(" ")}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
