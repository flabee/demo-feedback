import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/connections", () => ({ getConnectionByEmail: vi.fn() }));

import { CalendarConnection } from "@/app/dashboard/_components/CalendarConnection";
import * as authMod from "@/lib/auth";
import * as connections from "@/lib/connections";

beforeEach(() => {
  vi.mocked(authMod.auth).mockReset();
  vi.mocked(connections.getConnectionByEmail).mockReset();
});

describe("CalendarConnection", () => {
  it("renders nothing when there is no session", async () => {
    vi.mocked(authMod.auth).mockResolvedValue(null as never);
    const { container } = render(await CalendarConnection());
    expect(container).toBeEmptyDOMElement();
  });

  it("degrades to nothing when the connection lookup errors", async () => {
    vi.mocked(authMod.auth).mockResolvedValue({ user: { email: "rep@example.com" } } as never);
    vi.mocked(connections.getConnectionByEmail).mockRejectedValue(new Error("supabase down"));
    const { container } = render(await CalendarConnection());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the connected card for an active connection", async () => {
    vi.mocked(authMod.auth).mockResolvedValue({ user: { email: "rep@example.com" } } as never);
    vi.mocked(connections.getConnectionByEmail).mockResolvedValue({
      email: "rep@example.com", scopes: "s", status: "active", connected_at: "2026-01-01",
    });
    const { getByText } = render(await CalendarConnection());
    expect(getByText(/Connected/i)).toBeInTheDocument();
  });

  it("looks up the connection with a lowercased email", async () => {
    vi.mocked(authMod.auth).mockResolvedValue({ user: { email: "Rep@Example.com" } } as never);
    vi.mocked(connections.getConnectionByEmail).mockResolvedValue({
      email: "rep@example.com", scopes: "s", status: "active", connected_at: "2026-01-01",
    });
    await CalendarConnection();
    expect(vi.mocked(connections.getConnectionByEmail)).toHaveBeenCalledWith("rep@example.com");
  });
});
