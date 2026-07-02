import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionCard } from "@/app/dashboard/_components/ConnectionCard";

describe("ConnectionCard", () => {
  it("prompts to connect when there is no connection", () => {
    render(<ConnectionCard status={null} />);
    expect(screen.getByRole("link", { name: /connect google calendar/i })).toHaveAttribute(
      "href",
      "/api/connect/google/start",
    );
  });

  it("shows connected state with a disconnect action", () => {
    render(<ConnectionCard status="active" />);
    expect(screen.getByText(/connected/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
  });

  it("prompts to reconnect when the token needs reconsent", () => {
    render(<ConnectionCard status="needs_reconsent" />);
    expect(screen.getByRole("link", { name: /reconnect/i })).toBeInTheDocument();
  });
});
