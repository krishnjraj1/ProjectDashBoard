import { describe, it, expect, vi, beforeEach } from "vitest";
import { sanitizeJiraError, SanitizedError } from "../../lib/jira/errors";

describe("sanitizeJiraError", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  describe("known status code mappings", () => {
    it("maps 401 to JIRA authentication failed", () => {
      const result = sanitizeJiraError(401, "Unauthorized access");
      expect(result).toEqual<SanitizedError>({
        status: 401,
        message: "JIRA authentication failed",
      });
    });

    it("maps 403 to JIRA access denied", () => {
      const result = sanitizeJiraError(403, "Forbidden resource");
      expect(result).toEqual<SanitizedError>({
        status: 403,
        message: "JIRA access denied",
      });
    });

    it("maps 404 to JIRA resource not found", () => {
      const result = sanitizeJiraError(404, "Issue PROJ-999 does not exist");
      expect(result).toEqual<SanitizedError>({
        status: 404,
        message: "JIRA resource not found",
      });
    });

    it("maps 429 to JIRA rate limit exceeded", () => {
      const result = sanitizeJiraError(429, "Rate limit hit, retry after 60s");
      expect(result).toEqual<SanitizedError>({
        status: 429,
        message: "JIRA rate limit exceeded",
      });
    });
  });

  describe("5xx status codes", () => {
    it("maps 500 to 502 JIRA service unavailable", () => {
      const result = sanitizeJiraError(500, "Internal server error");
      expect(result).toEqual<SanitizedError>({
        status: 502,
        message: "JIRA service unavailable",
      });
    });

    it("maps 502 to 502 JIRA service unavailable", () => {
      const result = sanitizeJiraError(502, "Bad gateway");
      expect(result).toEqual<SanitizedError>({
        status: 502,
        message: "JIRA service unavailable",
      });
    });

    it("maps 503 to 502 JIRA service unavailable", () => {
      const result = sanitizeJiraError(503, "Service temporarily unavailable");
      expect(result).toEqual<SanitizedError>({
        status: 502,
        message: "JIRA service unavailable",
      });
    });

    it("maps 599 to 502 JIRA service unavailable", () => {
      const result = sanitizeJiraError(599, "Unknown server error");
      expect(result).toEqual<SanitizedError>({
        status: 502,
        message: "JIRA service unavailable",
      });
    });
  });

  describe("other 4xx status codes", () => {
    it("maps 400 to original status with generic message", () => {
      const result = sanitizeJiraError(400, "Bad request: invalid JQL");
      expect(result).toEqual<SanitizedError>({
        status: 400,
        message: "JIRA request failed",
      });
    });

    it("maps 405 to original status with generic message", () => {
      const result = sanitizeJiraError(405, "Method not allowed");
      expect(result).toEqual<SanitizedError>({
        status: 405,
        message: "JIRA request failed",
      });
    });

    it("maps 422 to original status with generic message", () => {
      const result = sanitizeJiraError(422, "Unprocessable entity");
      expect(result).toEqual<SanitizedError>({
        status: 422,
        message: "JIRA request failed",
      });
    });
  });

  describe("raw message never exposed", () => {
    it("does not include raw message in returned error for 401", () => {
      const rawMessage = "Secret internal error: stack trace at line 42";
      const result = sanitizeJiraError(401, rawMessage);
      expect(result.message).not.toContain(rawMessage);
      expect(result.message).not.toContain("stack trace");
    });

    it("does not include raw message in returned error for 5xx", () => {
      const rawMessage = "Database connection failed at jdbc:postgresql://internal-host:5432";
      const result = sanitizeJiraError(500, rawMessage);
      expect(result.message).not.toContain(rawMessage);
      expect(result.message).not.toContain("Database");
    });

    it("does not include raw message in returned error for other 4xx", () => {
      const rawMessage = "JQL parse error: unexpected token at position 15";
      const result = sanitizeJiraError(400, rawMessage);
      expect(result.message).not.toContain(rawMessage);
      expect(result.message).not.toContain("JQL parse");
    });
  });

  describe("server-side logging", () => {
    it("logs raw error details at warn level", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      sanitizeJiraError(401, "Raw error body from JIRA");
      expect(warnSpy).toHaveBeenCalledWith("JIRA API error details:", {
        status: 401,
        rawMessage: "Raw error body from JIRA",
      });
    });

    it("logs raw details for 5xx errors", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      sanitizeJiraError(503, "Service down for maintenance");
      expect(warnSpy).toHaveBeenCalledWith("JIRA API error details:", {
        status: 503,
        rawMessage: "Service down for maintenance",
      });
    });
  });
});
