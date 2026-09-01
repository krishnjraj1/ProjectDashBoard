import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import BoardsSection from "@/app/components/BoardsSection";

describe("BoardsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays loading skeleton while fetching", () => {
    // Never resolves — stays in loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<BoardsSection />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays boards in a table on success", async () => {
    const boards = [
      { id: 1, name: "Sprint Board", type: "scrum" },
      { id: 2, name: "Support Board", type: "kanban" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => boards,
    });

    render(<BoardsSection />);

    await waitFor(() => {
      expect(screen.getByText("Sprint Board")).toBeInTheDocument();
    });

    expect(screen.getByText("Support Board")).toBeInTheDocument();
    expect(screen.getByText("scrum")).toBeInTheDocument();
    expect(screen.getByText("kanban")).toBeInTheDocument();
  });

  it("displays error message in a red-bordered container on failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "JIRA authentication failed" }),
    });

    render(<BoardsSection />);

    await waitFor(() => {
      expect(screen.getByText("JIRA authentication failed")).toBeInTheDocument();
    });

    const errorContainer = screen.getByText("JIRA authentication failed").closest("div");
    expect(errorContainer).toHaveClass("border-red-300");
  });

  it('displays "No boards found" when array is empty', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<BoardsSection />);

    await waitFor(() => {
      expect(screen.getByText("No boards found")).toBeInTheDocument();
    });
  });

  it("displays error message when fetch throws a network error", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));

    render(<BoardsSection />);

    await waitFor(() => {
      expect(screen.getByText("Failed to fetch boards")).toBeInTheDocument();
    });
  });

  it("renders type badges with correct styling", async () => {
    const boards = [
      { id: 1, name: "Scrum Board", type: "scrum" },
      { id: 2, name: "Kanban Board", type: "kanban" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => boards,
    });

    render(<BoardsSection />);

    await waitFor(() => {
      expect(screen.getByText("scrum")).toBeInTheDocument();
    });

    const scrumBadge = screen.getByText("scrum");
    expect(scrumBadge).toHaveClass("bg-blue-100", "text-blue-800");

    const kanbanBadge = screen.getByText("kanban");
    expect(kanbanBadge).toHaveClass("bg-purple-100", "text-purple-800");
  });
});
