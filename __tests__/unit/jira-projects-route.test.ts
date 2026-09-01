import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock jiraFetch
vi.mock("@/lib/jira/client", () => ({
  jiraFetch: vi.fn(),
}));

import { GET } from "@/app/api/jira/projects/route";
import { jiraFetch } from "@/lib/jira/client";

const mockJiraFetch = vi.mocked(jiraFetch);

describe("GET /api/jira/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns transformed projects on success", async () => {
    mockJiraFetch.mockResolvedValue({
      data: [
        { id: "1", key: "PROJ", name: "My Project", projectTypeKey: "software" },
        { id: "2", key: "TEAM", name: "Team Board", projectTypeKey: "business" },
      ],
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      { key: "PROJ", name: "My Project" },
      { key: "TEAM", name: "Team Board" },
    ]);
    expect(mockJiraFetch).toHaveBeenCalledWith("/rest/api/3/project");
  });

  it("returns 500 when config validation fails", async () => {
    mockJiraFetch.mockResolvedValue({
      error: { status: 500, message: "JIRA configuration incomplete: missing JIRA_BASE_URL" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "JIRA configuration incomplete: missing JIRA_BASE_URL" });
  });

  it("returns mapped status on JIRA auth error", async () => {
    mockJiraFetch.mockResolvedValue({
      error: { status: 401, message: "JIRA authentication failed" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "JIRA authentication failed" });
  });

  it("returns 502 on timeout", async () => {
    mockJiraFetch.mockResolvedValue({
      error: { status: 502, message: "Unable to connect to JIRA: request timed out" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Unable to connect to JIRA: request timed out" });
  });

  it("returns empty array when JIRA returns no projects", async () => {
    mockJiraFetch.mockResolvedValue({ data: [] });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
