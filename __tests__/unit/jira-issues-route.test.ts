import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the jiraFetch module
vi.mock("@/lib/jira/client", () => ({
  jiraFetch: vi.fn(),
}));

import { GET } from "@/app/api/jira/issues/route";
import { jiraFetch } from "@/lib/jira/client";
import { JiraApiSearchResponse } from "@/lib/jira/types";

function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, "http://localhost"));
}

describe("GET /api/jira/issues", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns transformed issues on success", async () => {
    const mockResponse: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 2,
      issues: [
        {
          id: "10001",
          key: "PROJ-1",
          self: "https://test.atlassian.net/rest/api/3/issue/10001",
          fields: { summary: "First issue", status: { name: "To Do" } },
        },
        {
          id: "10002",
          key: "PROJ-2",
          self: "https://test.atlassian.net/rest/api/3/issue/10002",
          fields: { summary: "Second issue", status: { name: "In Progress" } },
        },
      ],
    };

    vi.mocked(jiraFetch).mockResolvedValueOnce({ data: mockResponse });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([
      { key: "PROJ-1", summary: "First issue", status: "To Do" },
      { key: "PROJ-2", summary: "Second issue", status: "In Progress" },
    ]);
  });

  it("returns 400 when projectKey is missing", async () => {
    const response = await GET(createRequest("/api/jira/issues"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Missing required parameter: projectKey" });
  });

  it("returns 400 when projectKey is invalid (lowercase)", async () => {
    const response = await GET(createRequest("/api/jira/issues?projectKey=proj"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid projectKey");
  });

  it("returns 400 when projectKey contains special characters", async () => {
    const response = await GET(createRequest("/api/jira/issues?projectKey=PR@J"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid projectKey");
  });

  it("returns 400 when projectKey is too long", async () => {
    const response = await GET(createRequest("/api/jira/issues?projectKey=ABCDEFGHIJK"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain("Invalid projectKey");
  });

  it("returns 500 when config is invalid", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 500, message: "JIRA_BASE_URL is not configured" },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: "JIRA_BASE_URL is not configured" });
  });

  it("returns mapped error status when JIRA returns 401", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 401, message: "JIRA authentication failed" },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "JIRA authentication failed" });
  });

  it("returns mapped error status when JIRA returns 403", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 403, message: "Forbidden" },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body).toEqual({ error: "Forbidden" });
  });

  it("returns mapped error status when JIRA returns 404", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 404, message: "Project not found" },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Project not found" });
  });

  it("returns 502 on timeout", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      error: { status: 502, message: "Unable to connect to JIRA: request timed out" },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({ error: "Unable to connect to JIRA: request timed out" });
  });

  it("returns empty array when no issues found", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      data: { startAt: 0, maxResults: 50, total: 0, issues: [] },
    });

    const response = await GET(createRequest("/api/jira/issues?projectKey=PROJ"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("calls jiraFetch with correct JQL endpoint using the projectKey", async () => {
    vi.mocked(jiraFetch).mockResolvedValueOnce({
      data: { startAt: 0, maxResults: 50, total: 0, issues: [] },
    });

    await GET(createRequest("/api/jira/issues?projectKey=MYPROJ"));

    expect(jiraFetch).toHaveBeenCalledWith(
      `/rest/api/3/search/jql?jql=${encodeURIComponent("project=MYPROJ")}&maxResults=50&fields=${encodeURIComponent("summary,status")}`
    );
  });
});
