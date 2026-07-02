import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(""),
}));

import { FilterBar } from "@/app/dashboard/_components/FilterBar";
import { parseFilters } from "@/lib/filters";

const products = ["Acme", "Beacon"];

describe("FilterBar", () => {
  beforeEach(() => push.mockClear());

  it("renders the current filter values", () => {
    render(
      <FilterBar
        filters={parseFilters({ signal: "hot" })}
        products={products}
      />,
    );
    // Signal is a segmented control; the active option is the checked radio.
    expect(screen.getByRole("radio", { name: /hot/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /^all$/i })).toHaveAttribute("aria-checked", "false");
  });

  it("pushes a new URL when the signal filter changes", () => {
    render(<FilterBar filters={parseFilters({})} products={products} />);
    fireEvent.click(screen.getByRole("radio", { name: /warm/i }));
    expect(push).toHaveBeenCalledOnce();
    expect(push.mock.calls[0][0]).toContain("signal=warm");
  });
});
