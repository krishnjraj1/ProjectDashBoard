import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { validateConfig } from "@/lib/jira/config";

describe("validateConfig", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns a valid JiraConfig when all env vars are correct", () => {
    process.env.JIRA_BASE_URL = "https://myteam.atlassian.net";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "some-token-123";

    const result = validateConfig();

    expect(result).toEqual({
      baseUrl: "https://myteam.atlassian.net",
      email: "user@example.com",
      apiToken: "some-token-123",
    });
  });

  it("returns error when JIRA_BASE_URL is missing", () => {
    delete process.env.JIRA_BASE_URL;
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_BASE_URL is missing or empty",
    });
  });

  it("returns error when JIRA_BASE_URL is empty string", () => {
    process.env.JIRA_BASE_URL = "";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_BASE_URL is missing or empty",
    });
  });

  it("returns error when JIRA_BASE_URL does not start with https://", () => {
    process.env.JIRA_BASE_URL = "http://myteam.atlassian.net";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "token";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_BASE_URL is missing or empty",
    });
  });

  it("returns error when JIRA_EMAIL is missing", () => {
    process.env.JIRA_BASE_URL = "https://myteam.atlassian.net";
    delete process.env.JIRA_EMAIL;
    process.env.JIRA_API_TOKEN = "token";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_EMAIL is missing or empty",
    });
  });

  it("returns error when JIRA_EMAIL is empty string", () => {
    process.env.JIRA_BASE_URL = "https://myteam.atlassian.net";
    process.env.JIRA_EMAIL = "";
    process.env.JIRA_API_TOKEN = "token";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_EMAIL is missing or empty",
    });
  });

  it("returns error when JIRA_API_TOKEN is missing", () => {
    process.env.JIRA_BASE_URL = "https://myteam.atlassian.net";
    process.env.JIRA_EMAIL = "user@example.com";
    delete process.env.JIRA_API_TOKEN;

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_API_TOKEN is missing or empty",
    });
  });

  it("returns error when JIRA_API_TOKEN is empty string", () => {
    process.env.JIRA_BASE_URL = "https://myteam.atlassian.net";
    process.env.JIRA_EMAIL = "user@example.com";
    process.env.JIRA_API_TOKEN = "";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_API_TOKEN is missing or empty",
    });
  });

  it("validates the first invalid variable in order (URL before email)", () => {
    process.env.JIRA_BASE_URL = "not-https";
    process.env.JIRA_EMAIL = "";
    process.env.JIRA_API_TOKEN = "";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_BASE_URL is missing or empty",
    });
  });

  it("validates the first invalid variable in order (email before token)", () => {
    process.env.JIRA_BASE_URL = "https://valid.atlassian.net";
    process.env.JIRA_EMAIL = "";
    process.env.JIRA_API_TOKEN = "";

    const result = validateConfig();

    expect(result).toEqual({
      error: "Server configuration error: JIRA_EMAIL is missing or empty",
    });
  });
});
