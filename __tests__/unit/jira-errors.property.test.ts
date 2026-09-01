// Feature: jira-connection, Property 4: Sanitized error mapping
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";
import { sanitizeJiraError } from "@/lib/jira/errors";

/**
 * Property 4: Sanitized error mapping
 *
 * For any HTTP error status code returned by the JIRA API, the proxy SHALL return
 * the appropriate mapped status code (401→401, 403→403, 404→404, 429→429, 5xx→502)
 * with a sanitized message string that does not contain the raw JIRA response body,
 * and the raw JIRA error SHALL be logged server-side only.
 *
 * Validates: Requirements 3.6
 */
describe("Property 4: Sanitized error mapping", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  // Generator for integer status codes in the 400–599 range
  const statusCodeArb = fc.integer({ min: 400, max: 599 });

  // Generator for arbitrary raw message strings (non-empty to be meaningful)
  const rawMessageArb = fc.oneof(
    fc.string({ minLength: 1, maxLength: 500 }),
    fc.lorem({ maxCount: 10 }).filter((s) => s.length > 0),
    fc.string({ minLength: 1, maxLength: 200 }).map(
      (s) => `Error details: ${s} at internal-host:5432`
    )
  );

  /**
   * Computes the expected status code based on the mapping rules:
   * - 401 → 401, 403 → 403, 404 → 404, 429 → 429
   * - 5xx (500–599) → 502
   * - Other 4xx → same status code
   */
  function expectedStatus(jiraStatus: number): number {
    if (jiraStatus >= 500 && jiraStatus <= 599) {
      return 502;
    }
    // Known 4xx codes are passed through as-is, as are unknown 4xx codes
    return jiraStatus;
  }

  it("returns the correct mapped status code for any error status in 400–599", () => {
    fc.assert(
      fc.property(statusCodeArb, rawMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        expect(result.status).toBe(expectedStatus(status));
      }),
      { numRuns: 100 }
    );
  });

  it("returned message does NOT contain the raw JIRA message", () => {
    // Use messages long enough to be meaningful (avoid trivial substrings like " ")
    const meaningfulMessageArb = fc
      .string({ minLength: 10, maxLength: 500 })
      .filter((s) => s.trim().length >= 10);

    fc.assert(
      fc.property(statusCodeArb, meaningfulMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        // The sanitized message must never include the raw JIRA response body
        expect(result.message).not.toContain(rawMessage);
      }),
      { numRuns: 100 }
    );
  });

  it("returned message is always one of the predefined sanitized strings", () => {
    const allowedMessages = new Set([
      "JIRA authentication failed",
      "JIRA access denied",
      "JIRA resource not found",
      "JIRA rate limit exceeded",
      "JIRA service unavailable",
      "JIRA request failed",
    ]);

    fc.assert(
      fc.property(statusCodeArb, rawMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        expect(allowedMessages.has(result.message)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("maps known 4xx codes to their specific messages", () => {
    const knownMappings: Record<number, string> = {
      401: "JIRA authentication failed",
      403: "JIRA access denied",
      404: "JIRA resource not found",
      429: "JIRA rate limit exceeded",
    };

    const knownStatusArb = fc.constantFrom(
      ...Object.keys(knownMappings).map(Number)
    );

    fc.assert(
      fc.property(knownStatusArb, rawMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        expect(result.status).toBe(status);
        expect(result.message).toBe(knownMappings[status]);
      }),
      { numRuns: 100 }
    );
  });

  it("maps all 5xx codes to status 502 with 'JIRA service unavailable'", () => {
    const serverErrorArb = fc.integer({ min: 500, max: 599 });

    fc.assert(
      fc.property(serverErrorArb, rawMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        expect(result.status).toBe(502);
        expect(result.message).toBe("JIRA service unavailable");
      }),
      { numRuns: 100 }
    );
  });

  it("maps other 4xx codes to same status with 'JIRA request failed'", () => {
    // Generate 4xx codes that are NOT the known ones (401, 403, 404, 429)
    const knownCodes = new Set([401, 403, 404, 429]);
    const other4xxArb = fc
      .integer({ min: 400, max: 499 })
      .filter((s) => !knownCodes.has(s));

    fc.assert(
      fc.property(other4xxArb, rawMessageArb, (status, rawMessage) => {
        const result = sanitizeJiraError(status, rawMessage);

        expect(result.status).toBe(status);
        expect(result.message).toBe("JIRA request failed");
      }),
      { numRuns: 100 }
    );
  });

  it("logs raw error details server-side for every status code", () => {
    fc.assert(
      fc.property(statusCodeArb, rawMessageArb, (status, rawMessage) => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        sanitizeJiraError(status, rawMessage);

        expect(warnSpy).toHaveBeenCalledWith("JIRA API error details:", {
          status,
          rawMessage,
        });
      }),
      { numRuns: 100 }
    );
  });
});
