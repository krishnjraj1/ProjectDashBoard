import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the jiraFetch module
vi.mock("@/lib/jira/client", () => ({
  jiraFetch: vi.fn(),
}));

import { GET } from "@/app/api/jira/boards/route";
import { jiraFetch } from "@/lib/jira/client";
import { JiraApiBoardResponse } from "@/lib/jira/types";

describe("GET /api/jira/boards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns transformed boards on success", async () => {
    const mockResponse: JiraApiBoardResponse = {
      maxResults: 50,
      startAt: 0,
      total: 2,
      isLast: true,
      values: [
        { id: 1, self: "https://test.atlassian.net/board/1", name: "Sprint Board", type: "scrum" },
        { id: 2, self: "https://test.atlassian.net/board/2", name: "Kanban Board", type: "kanban" },
      ],
    };

    vi.mocked(jiraFetch).mockResolvedValueOnce({ data: mockResponse });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      { id: 1, name: "Sprint Board", type: "scrum" },
      { id: 2, name: "Kanban Board", type: "kanban" },
    ]);
  });

  it("calls jiraFetch with the correct agile board endpoint", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      data: { maxResults: 50, startAt: 0, total: 0, isLast: true, values: [] },
    });

    await GET();

    expect(jiraFetch).toHaveBeenCalledWith("/rest/agile/1.0/board");
  });

  it("returns 500 error on config validation failure", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 500, message: "JIRA_BASE_URL is not configured" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "JIRA_BASE_URL is not configured" });
  });

  it("returns mapped status on JIRA authentication error", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 401, message: "JIRA authentication failed" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "JIRA authentication failed" });
  });

  it("returns 502 on timeout error", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 502, message: "Unable to connect to JIRA: request timed out" },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Unable to connect to JIRA: request timed out" });
  });

  it("returns JSON content type header", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      data: { maxResults: 50, startAt: 0, total: 0, isLast: true, values: [] },
    });

    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("returns empty array when no boards exist", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      data: { maxResults: 50, startAt: 0, total: 0, isLast: true, values: [] },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });
});
