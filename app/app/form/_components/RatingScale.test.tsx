import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RatingScale } from "@/app/form/_components/RatingScale";

describe("RatingScale", () => {
  it("renders one button per value in the inclusive range", () => {
    render(<RatingScale ariaLabel="NPS" min={0} max={10} value={null} onChange={() => {}} />);
    expect(screen.getAllByRole("radio")).toHaveLength(11);
  });

  it("marks the selected value as checked", () => {
    render(<RatingScale ariaLabel="Rilevanza" min={1} max={5} value={3} onChange={() => {}} />);
    expect(screen.getByRole("radio", { name: "3" })).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange with the clicked value", () => {
    const onChange = vi.fn();
    render(<RatingScale ariaLabel="Rilevanza" min={1} max={5} value={null} onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });
});
