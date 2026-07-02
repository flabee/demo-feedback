import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SignalBadge } from "@/app/dashboard/_components/SignalBadge";

describe("SignalBadge", () => {
  it("renders the signal label when a signal is present", () => {
    render(<SignalBadge signal="hot" />);
    expect(screen.getByText(/hot/i)).toBeInTheDocument();
  });

  it("renders a pending label when signal is null", () => {
    render(<SignalBadge signal={null} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});
