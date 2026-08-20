// Feature: jira-connection, Property 1: Config validation correctness
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import { validateConfig, JiraConfig, ConfigError } from "@/lib/jira/config";

/**
 * Property 1: Config validation correctness
 *
 * For any combination of environment variable values (JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN),
 * the validation function SHALL return a valid config if and only if JIRA_BASE_URL starts with
 * "https://", JIRA_EMAIL is non-empty, and JIRA_API_TOKEN is non-empty; otherwise it SHALL
 * return an error naming the first invalid variable.
 *
 * Validates: Requirements 2.1, 2.4
 */
describe("Property 1: Config validation correctness", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  function isValidResult(result: JiraConfig | ConfigError): result is JiraConfig {
    return "baseUrl" in result && "email" in result && "apiToken" in result;
  }

  function isErrorResult(result: JiraConfig | ConfigError): result is ConfigError {
    return "error" in result;
  }

  // Generator for arbitrary strings including empty strings and whitespace
  const arbitraryString = fc.oneof(
    fc.constant(""),
    fc.constant(" "),
    fc.constant("  \t\n  "),
    fc.string(),
    fc.string({ minLength: 0, maxLength: 50 })
  );

  // Generator for URLs that do NOT start with "https://"
  const invalidUrl = fc.oneof(
    fc.constant(""),
    fc.constant(" "),
    fc.constant("http://example.com"),
    fc.constant("ftp://example.com"),
    fc.constant("https//missing-colon.com"),
    fc.constant("htt://example.com"),
    fc.string().filter((s) => !s.startsWith("https://"))
  );

  // Generator for valid HTTPS URLs
  const validUrl = fc
    .string({ minLength: 1 })
    .filter((s) => !s.includes("\0"))
    .map((s) => `https://${s.replace(/\s/g, "x") || "a"}`);

  // Generator for non-empty strings (valid email/token)
  const nonEmptyString = fc.string({ minLength: 1 }).filter((s) => s.length > 0);

  it("returns valid config when URL starts with https://, email non-empty, token non-empty", () => {
    fc.assert(
      fc.property(validUrl, nonEmptyString, nonEmptyString, (url, email, token) => {
        process.env.JIRA_BASE_URL = url;
        process.env.JIRA_EMAIL = email;
        process.env.JIRA_API_TOKEN = token;

        const result = validateConfig();

        expect(isValidResult(result)).toBe(true);
        if (isValidResult(result)) {
          expect(result.baseUrl).toBe(url);
          expect(result.email).toBe(email);
          expect(result.apiToken).toBe(token);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns error naming JIRA_BASE_URL when URL does not start with https://", () => {
    fc.assert(
      fc.property(invalidUrl, arbitraryString, arbitraryString, (url, email, token) => {
        process.env.JIRA_BASE_URL = url;
        process.env.JIRA_EMAIL = email;
        process.env.JIRA_API_TOKEN = token;

        const result = validateConfig();

        expect(isErrorResult(result)).toBe(true);
        if (isErrorResult(result)) {
          expect(result.error).toContain("JIRA_BASE_URL");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns error naming JIRA_EMAIL when URL is valid but email is empty", () => {
    fc.assert(
      fc.property(validUrl, nonEmptyString, (url, token) => {
        process.env.JIRA_BASE_URL = url;
        process.env.JIRA_EMAIL = "";
        process.env.JIRA_API_TOKEN = token;

        const result = validateConfig();

        expect(isErrorResult(result)).toBe(true);
        if (isErrorResult(result)) {
          expect(result.error).toContain("JIRA_EMAIL");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("returns error naming JIRA_API_TOKEN when URL and email are valid but token is empty", () => {
    fc.assert(
      fc.property(validUrl, nonEmptyString, (url, email) => {
        process.env.JIRA_BASE_URL = url;
        process.env.JIRA_EMAIL = email;
        process.env.JIRA_API_TOKEN = "";

        const result = validateConfig();

        expect(isErrorResult(result)).toBe(true);
        if (isErrorResult(result)) {
          expect(result.error).toContain("JIRA_API_TOKEN");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("validates in priority order: URL first, then email, then token", () => {
    fc.assert(
      fc.property(
        invalidUrl,
        fc.constant(""),
        fc.constant(""),
        (url, email, token) => {
          process.env.JIRA_BASE_URL = url;
          process.env.JIRA_EMAIL = email;
          process.env.JIRA_API_TOKEN = token;

          const result = validateConfig();

          // When URL is invalid, error should mention JIRA_BASE_URL regardless of other fields
          expect(isErrorResult(result)).toBe(true);
          if (isErrorResult(result)) {
            expect(result.error).toContain("JIRA_BASE_URL");
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("bi-conditional: valid config iff all three conditions met", () => {
    fc.assert(
      fc.property(arbitraryString, arbitraryString, arbitraryString, (url, email, token) => {
        process.env.JIRA_BASE_URL = url;
        process.env.JIRA_EMAIL = email;
        process.env.JIRA_API_TOKEN = token;

        const result = validateConfig();

        const urlValid = url.startsWith("https://");
        const emailValid = email.length > 0;
        const tokenValid = token.length > 0;
        const allValid = urlValid && emailValid && tokenValid;

        if (allValid) {
          // Should return valid config
          expect(isValidResult(result)).toBe(true);
        } else {
          // Should return error
          expect(isErrorResult(result)).toBe(true);
          if (isErrorResult(result)) {
            // Error should name the first invalid variable in priority order
            if (!urlValid) {
              expect(result.error).toContain("JIRA_BASE_URL");
            } else if (!emailValid) {
              expect(result.error).toContain("JIRA_EMAIL");
            } else {
              expect(result.error).toContain("JIRA_API_TOKEN");
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});
