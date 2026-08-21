import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import IssuesSection from "@/app/components/IssuesSection";

describe("IssuesSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays "Select a project to view issues" when no project selected', () => {
    render(<IssuesSection />);

    expect(screen.getByText("Select a project to view issues")).toBeInTheDocument();
  });

  it("displays loading skeleton when fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<IssuesSection selectedProjectKey="PROJ" />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays issue key, summary, and status on success", async () => {
    const issues = [
      { key: "PROJ-1", summary: "Fix login bug", status: "Done" },
      { key: "PROJ-2", summary: "Add dashboard", status: "In Progress" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => issues,
    });

    render(<IssuesSection selectedProjectKey="PROJ" />);

    await waitFor(() => {
      expect(screen.getByText("PROJ-1")).toBeInTheDocument();
    });

    expect(screen.getByText("Fix login bug")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("PROJ-2")).toBeInTheDocument();
    expect(screen.getByText("Add dashboard")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("renders status badges with correct color coding", async () => {
    const issues = [
      { key: "PROJ-1", summary: "Completed task", status: "Done" },
      { key: "PROJ-2", summary: "Active task", status: "In Progress" },
      { key: "PROJ-3", summary: "Pending task", status: "To Do" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => issues,
    });

    render(<IssuesSection selectedProjectKey="PROJ" />);

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    });

    const doneBadge = screen.getByText("Done");
    expect(doneBadge).toHaveClass("bg-green-100", "text-green-800");

    const inProgressBadge = screen.getByText("In Progress");
    expect(inProgressBadge).toHaveClass("bg-blue-100", "text-blue-800");

    const todoBadge = screen.getByText("To Do");
    expect(todoBadge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("displays error in red-bordered container on failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Failed to load issues" }),
    });

    render(<IssuesSection selectedProjectKey="PROJ" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load issues")).toBeInTheDocument();
    });

    const errorContainer = screen.getByText("Failed to load issues").closest("div");
    expect(errorContainer).toHaveClass("border-red-300");
  });

  it('displays "No issues found for this project" on empty response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<IssuesSection selectedProjectKey="PROJ" />);

    await waitFor(() => {
      expect(screen.getByText("No issues found for this project")).toBeInTheDocument();
    });
  });

  it("re-fetches when selectedProjectKey changes", async () => {
    const issuesA = [{ key: "A-1", summary: "Issue A", status: "Done" }];
    const issuesB = [{ key: "B-1", summary: "Issue B", status: "To Do" }];

    (global.fetch as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ ok: true, json: async () => issuesA })
      .mockResolvedValueOnce({ ok: true, json: async () => issuesB });

    const { rerender } = render(<IssuesSection selectedProjectKey="A" />);

    await waitFor(() => {
      expect(screen.getByText("A-1")).toBeInTheDocument();
    });

    rerender(<IssuesSection selectedProjectKey="B" />);

    await waitFor(() => {
      expect(screen.getByText("B-1")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
