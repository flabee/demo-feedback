import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponsesTable } from "@/app/dashboard/_components/ResponsesTable";
import type { ViewRow } from "@/lib/types";

const rows: ViewRow[] = [
  {
    id: "1", prospectName: "Mario Rossi", prospectEmail: "mario@acme.com",
    company: "Acme", product: "Relay", demoOwner: "Alex", status: "completed",
    score: 88, signal: "hot", nps: 9,
    ratings: { relevance: 4, satisfaction: 5, clarity: 4, purchaseIntent: 5 },
    comment: "Great", date: "2026-06-21T09:00:00Z",
  },
  {
    id: "2", prospectName: "Lucia Bianchi", prospectEmail: "lucia@globex.com",
    company: "Globex", product: "Beacon", demoOwner: "Alex", status: "pending",
    score: null, signal: null, nps: null, ratings: null, comment: null,
    date: "2026-06-22T10:00:00Z",
  },
];

describe("ResponsesTable", () => {
  it("renders a row per response with key fields", () => {
    render(<ResponsesTable rows={rows} />);
    expect(screen.getByText("Mario Rossi")).toBeInTheDocument();
    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });

  it("shows a dash for score/nps on pending rows", () => {
    render(<ResponsesTable rows={rows} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("opens the drawer with the row detail when a row is clicked", () => {
    render(<ResponsesTable rows={rows} />);
    fireEvent.click(screen.getByText("Mario Rossi"));
    expect(screen.getByText("Great")).toBeInTheDocument();
  });

  it("renders an empty state when there are no rows", () => {
    render(<ResponsesTable rows={[]} />);
    expect(screen.getByText(/no prospects match/i)).toBeInTheDocument();
  });
});
