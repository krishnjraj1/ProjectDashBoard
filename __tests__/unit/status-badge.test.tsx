import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import StatusBadge from "@/app/components/StatusBadge";

describe("StatusBadge", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays 'Checking...' initially while the request is in progress", () => {
    // Mock fetch to never resolve during this test
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    render(<StatusBadge />);
    expect(screen.getByText("Checking...")).toBeInTheDocument();
  });

  it("displays 'Connected' with green badge and base URL on successful response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ status: "connected", baseUrl: "https://myteam.atlassian.net" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<StatusBadge />);

    await waitFor(() => {
      expect(screen.getByText("Connected")).toBeInTheDocument();
    });

    expect(screen.getByText("https://myteam.atlassian.net")).toBeInTheDocument();

    const badge = screen.getByText("Connected");
    expect(badge).toHaveClass("bg-green-100", "text-green-800", "border-green-200");
  });

  it("displays 'Disconnected' with red badge on error response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ status: "disconnected", error: "JIRA authentication failed" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<StatusBadge />);

    await waitFor(() => {
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    const badge = screen.getByText("Disconnected");
    expect(badge).toHaveClass("bg-red-100", "text-red-800", "border-red-200");
  });

  it("displays 'Disconnected' on network error", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));

    render(<StatusBadge />);

    await waitFor(() => {
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });
  });

  it("displays 'Disconnected' on abort (timeout)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new DOMException("Aborted", "AbortError"));

    render(<StatusBadge />);

    await waitFor(() => {
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });
  });

  it("does not display base URL when disconnected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ status: "disconnected", error: "timeout" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      )
    );

    render(<StatusBadge />);

    await waitFor(() => {
      expect(screen.getByText("Disconnected")).toBeInTheDocument();
    });

    expect(screen.queryByText(/atlassian/)).not.toBeInTheDocument();
  });

  it("applies neutral styling while checking", () => {
    vi.spyOn(global, "fetch").mockReturnValue(new Promise(() => {}));

    render(<StatusBadge />);

    const badge = screen.getByText("Checking...");
    expect(badge).toHaveClass("bg-gray-100", "text-gray-600", "border-gray-200");
  });
});
