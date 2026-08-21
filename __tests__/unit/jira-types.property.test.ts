// Feature: jira-connection, Property 3: Issue response capping
/**
 * Property-based test for issue response capping.
 *
 * Validates: Requirements 3.3
 *
 * For any mock JIRA search response containing N issues (where N ≥ 0),
 * the issues transformation function shall return at most 50 issues,
 * and each returned issue shall contain exactly the `key`, `summary`,
 * and `status` fields extracted from the source.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { transformIssues, JiraApiSearchResponse } from "@/lib/jira/types";

// Generator for a single mock JIRA API issue
const arbJiraApiIssue = fc.record({
  id: fc.string({ minLength: 1 }),
  key: fc.string({ minLength: 1 }),
  self: fc.string({ minLength: 1 }),
  fields: fc.record({
    summary: fc.string({ minLength: 1 }),
    status: fc.record({
      name: fc.string({ minLength: 1 }),
    }),
  }),
});

// Generator for a mock JiraApiSearchResponse with 0–200 issues
const arbJiraSearchResponse = fc
  .array(arbJiraApiIssue, { minLength: 0, maxLength: 200 })
  .map((issues) => ({
    startAt: 0,
    maxResults: 50,
    total: issues.length,
    issues,
  }));

describe("Property 3: Issue response capping", () => {
  it("output length is always ≤ 50 regardless of input size", () => {
    fc.assert(
      fc.property(arbJiraSearchResponse, (raw: JiraApiSearchResponse) => {
        const result = transformIssues(raw);
        expect(result.length).toBeLessThanOrEqual(50);
      }),
      { numRuns: 100 }
    );
  });

  it("each transformed item contains exactly key, summary, status fields", () => {
    fc.assert(
      fc.property(arbJiraSearchResponse, (raw: JiraApiSearchResponse) => {
        const result = transformIssues(raw);
        for (const item of result) {
          expect(Object.keys(item).sort()).toEqual(["key", "status", "summary"]);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("transformed values match source data", () => {
    fc.assert(
      fc.property(arbJiraSearchResponse, (raw: JiraApiSearchResponse) => {
        const result = transformIssues(raw);
        for (let i = 0; i < result.length; i++) {
          expect(result[i].key).toBe(raw.issues[i].key);
          expect(result[i].summary).toBe(raw.issues[i].fields.summary);
          expect(result[i].status).toBe(raw.issues[i].fields.status.name);
        }
      }),
      { numRuns: 100 }
    );
  });
});
