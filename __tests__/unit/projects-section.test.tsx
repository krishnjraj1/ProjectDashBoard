import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ProjectsSection from "@/app/components/ProjectsSection";

describe("ProjectsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("displays loading skeleton while fetching", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(<ProjectsSection onProjectSelect={() => {}} />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("displays project key and name in table on success", async () => {
    const projects = [
      { key: "PROJ", name: "Project Alpha" },
      { key: "TEAM", name: "Team Beta" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => projects,
    });

    render(<ProjectsSection onProjectSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("PROJ")).toBeInTheDocument();
    });

    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("TEAM")).toBeInTheDocument();
    expect(screen.getByText("Team Beta")).toBeInTheDocument();
  });

  it("calls onProjectSelect with correct key on row click", async () => {
    const projects = [{ key: "PROJ", name: "Project Alpha" }];
    const onProjectSelect = vi.fn();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => projects,
    });

    render(<ProjectsSection onProjectSelect={onProjectSelect} />);

    await waitFor(() => {
      expect(screen.getByText("PROJ")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("project-row-PROJ"));

    expect(onProjectSelect).toHaveBeenCalledWith("PROJ");
  });

  it("highlights the selected row with bg-blue-50", async () => {
    const projects = [
      { key: "PROJ", name: "Project Alpha" },
      { key: "TEAM", name: "Team Beta" },
    ];

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => projects,
    });

    render(<ProjectsSection onProjectSelect={() => {}} selectedProjectKey="PROJ" />);

    await waitFor(() => {
      expect(screen.getByTestId("project-row-PROJ")).toBeInTheDocument();
    });

    expect(screen.getByTestId("project-row-PROJ")).toHaveClass("bg-blue-50");
    expect(screen.getByTestId("project-row-TEAM")).not.toHaveClass("bg-blue-50");
  });

  it("displays error in red-bordered container on failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "JIRA authentication failed" }),
    });

    render(<ProjectsSection onProjectSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("JIRA authentication failed")).toBeInTheDocument();
    });

    const errorContainer = screen.getByTestId("projects-error");
    expect(errorContainer).toHaveClass("border-red-300");
  });

  it('displays "No projects found" on empty response', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<ProjectsSection onProjectSelect={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });
  });
});
