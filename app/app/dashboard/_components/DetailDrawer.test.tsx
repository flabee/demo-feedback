import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DetailDrawer } from "@/app/dashboard/_components/DetailDrawer";
import type { ViewRow } from "@/lib/types";

const completed: ViewRow = {
  id: "1", prospectName: "Mario Rossi", prospectEmail: "mario@acme.com",
  company: "Acme", product: "Acme", demoOwner: "Alex", status: "completed",
  score: 88, signal: "hot", nps: 9,
  ratings: { relevance: 4, satisfaction: 5, clarity: 4, purchaseIntent: 5 },
  comment: "Loved the demo", date: "2026-06-21T09:00:00Z",
};

const pending: ViewRow = {
  ...completed, id: "2", status: "pending", score: null, signal: null,
  nps: null, ratings: null, comment: null,
};

describe("DetailDrawer", () => {
  it("renders nothing when no row is selected", () => {
    const { container } = render(<DetailDrawer row={null} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows ratings and comment for a completed row", () => {
    render(<DetailDrawer row={completed} onClose={() => {}} />);
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("Loved the demo")).toBeInTheDocument();
    expect(screen.getByText(/purchase intent/i)).toBeInTheDocument();
  });

  it("shows an awaiting-feedback message for a pending row", () => {
    render(<DetailDrawer row={pending} onClose={() => {}} />);
    expect(screen.getByText(/awaiting feedback/i)).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<DetailDrawer row={completed} onClose={onClose} />);
    screen.getByRole("button", { name: /close/i }).click();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
