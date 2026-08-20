import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAuthHeader, jiraFetch } from "@/lib/jira/client";

describe("createAuthHeader", () => {
  it("produces correct Basic auth header for known email and token", () => {
    const result = createAuthHeader("user@example.com", "my-api-token");
    const expected =
      "Basic " +
      Buffer.from("user@example.com:my-api-token").toString("base64");
    expect(result).toBe(expected);
  });

  it("starts with 'Basic ' prefix", () => {
    const result = createAuthHeader("a@b.com", "tok");
    expect(result).toMatch(/^Basic /);
  });

  it("base64 portion decodes to email:token", () => {
    const email = "test@domain.org";
    const token = "secret123";
    const result = createAuthHeader(email, token);
    const base64Part = result.replace("Basic ", "");
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
    expect(decoded).toBe(`${email}:${token}`);
  });

  it("handles special characters in email and token", () => {
    const email = "user+tag@example.com";
    const token = "p@$$w0rd!#%^&*";
    const result = createAuthHeader(email, token);
    const base64Part = result.replace("Basic ", "");
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
    expect(decoded).toBe(`${email}:${token}`);
  });
});

describe("jiraFetch", () => {
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

  it("returns config error when env vars are missing", async () => {
    process.env.JIRA_BASE_URL = "";

    const result = await jiraFetch("/rest/api/3/myself");

    expect(result.error).toBeDefined();
    expect(result.error!.status).toBe(500);
    expect(result.error!.message).toContain("JIRA_BASE_URL");
    expect(result.data).toBeUndefined();
  });

  it("returns parsed JSON data on successful response", async () => {
    const mockData = { accountId: "123", displayName: "Test User" };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await jiraFetch<typeof mockData>("/rest/api/3/myself");

    expect(result.data).toEqual(mockData);
    expect(result.error).toBeUndefined();
  });

  it("sends correct authorization and accept headers", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await jiraFetch("/rest/api/3/myself");

    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestInit = call[1] as RequestInit;
    const headers = requestInit.headers as Record<string, string>;

    expect(headers.Authorization).toBe(
      createAuthHeader("user@example.com", "test-token")
    );
    expect(headers.Accept).toBe("application/json");
  });

  it("constructs correct URL from base URL and path", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await jiraFetch("/rest/api/3/project");

    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(call[0]).toBe("https://test.atlassian.net/rest/api/3/project");
  });

  it("returns 401 error on JIRA authentication failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    const result = await jiraFetch("/rest/api/3/myself");

    expect(result.error).toEqual({
      status: 401,
      message: "JIRA authentication failed",
    });
    expect(result.data).toBeUndefined();
  });

  it("returns 403 error on JIRA access denied", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Forbidden", { status: 403 })
    );

    const result = await jiraFetch("/rest/api/3/myself");

    expect(result.error).toEqual({
      status: 403,
      message: "JIRA access denied",
    });
  });

  it("returns 404 error on JIRA resource not found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Not Found", { status: 404 })
    );

    const result = await jiraFetch("/rest/api/3/project/UNKNOWN");

    expect(result.error).toEqual({
      status: 404,
      message: "JIRA resource not found",
    });
  });

  it("returns 429 error on JIRA rate limit", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Too Many Requests", { status: 429 })
    );

    const result = await jiraFetch("/rest/api/3/project");

    expect(result.error).toEqual({
      status: 429,
      message: "JIRA rate limit exceeded",
    });
  });

  it("returns 502 error on JIRA 5xx response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Internal Server Error", { status: 500 })
    );

    const result = await jiraFetch("/rest/api/3/project");

    expect(result.error).toEqual({
      status: 502,
      message: "JIRA service unavailable",
    });
  });

  it("returns 502 on timeout (AbortError)", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() => {
      const error = new Error("The operation was aborted");
      error.name = "AbortError";
      return Promise.reject(error);
    });

    const result = await jiraFetch("/rest/api/3/myself");

    expect(result.error).toEqual({
      status: 502,
      message: "Unable to connect to JIRA: request timed out",
    });
  });

  it("returns 502 on network error", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("fetch failed")
    );

    const result = await jiraFetch("/rest/api/3/myself");

    expect(result.error).toEqual({
      status: 502,
      message: "Unable to connect to JIRA: fetch failed",
    });
  });

  it("does not leak raw JIRA error messages to client", async () => {
    const rawJiraError =
      '{"errorMessages":["Issue does not exist or you do not have permission"],"errors":{}}';
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(rawJiraError, { status: 404 })
    );

    const result = await jiraFetch("/rest/api/3/issue/FAKE-1");

    expect(result.error!.message).toBe("JIRA resource not found");
    expect(result.error!.message).not.toContain("Issue does not exist");
  });

  it("passes AbortController signal to fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );

    await jiraFetch("/rest/api/3/myself");

    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    const requestInit = call[1] as RequestInit;
    expect(requestInit.signal).toBeInstanceOf(AbortSignal);
  });
});
