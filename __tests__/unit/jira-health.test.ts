import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/jira/health/route";

describe("GET /api/jira/health", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      JIRA_BASE_URL: "https://test.atlassian.net",
      JIRA_EMAIL: "user@example.com",
      JIRA_API_TOKEN: "test-token",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("returns 200 with connected status on successful JIRA call", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ accountId: "123", displayName: "Test User" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      status: "connected",
      baseUrl: "https://test.atlassian.net",
    });
  });

  it("returns 503 with disconnected status when JIRA returns error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "disconnected",
      error: "JIRA authentication failed",
    });
  });

  it("returns 503 with disconnected status when config is invalid", async () => {
    process.env.JIRA_BASE_URL = "";

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("disconnected");
    expect(body.error).toContain("JIRA_BASE_URL");
  });

  it("returns 503 with disconnected status on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("fetch failed")
    );

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "disconnected",
      error: "Unable to connect to JIRA: fetch failed",
    });
  });

  it("returns 503 with disconnected status on timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({
      status: "disconnected",
      error: "Unable to connect to JIRA: request timed out",
    });
  });

  it("sets Content-Type to application/json", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ accountId: "123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const response = await GET();

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("calls /rest/api/3/myself endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ accountId: "123" }), { status: 200 })
    );

    await GET();

    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(call[0]).toBe("https://test.atlassian.net/rest/api/3/myself");
  });
});
