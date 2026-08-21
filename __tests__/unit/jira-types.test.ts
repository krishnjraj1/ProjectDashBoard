/**
 * Unit tests for JIRA types and transformation functions.
 *
 * Tests transformProjects, transformBoards, and transformIssues
 * for correct field extraction, edge cases, and the 50-issue cap.
 */

import { describe, it, expect } from "vitest";
import {
  transformProjects,
  transformBoards,
  transformIssues,
  JiraApiProject,
  JiraApiBoardResponse,
  JiraApiSearchResponse,
} from "@/lib/jira/types";

describe("transformProjects", () => {
  it("extracts key and name from raw projects", () => {
    const raw: JiraApiProject[] = [
      { id: "10001", key: "PROJ", name: "My Project", projectTypeKey: "software" },
      { id: "10002", key: "TEAM", name: "Team Board", projectTypeKey: "business" },
    ];

    const result = transformProjects(raw);

    expect(result).toEqual([
      { key: "PROJ", name: "My Project" },
      { key: "TEAM", name: "Team Board" },
    ]);
  });

  it("returns empty array for empty input", () => {
    const result = transformProjects([]);
    expect(result).toEqual([]);
  });

  it("does not include extra fields from raw response", () => {
    const raw: JiraApiProject[] = [
      { id: "10001", key: "ABC", name: "Alpha", projectTypeKey: "software" },
    ];

    const result = transformProjects(raw);

    expect(Object.keys(result[0])).toEqual(["key", "name"]);
  });
});

describe("transformBoards", () => {
  it("extracts id, name, and type from raw board response values", () => {
    const raw: JiraApiBoardResponse = {
      maxResults: 50,
      startAt: 0,
      total: 2,
      isLast: true,
      values: [
        { id: 1, self: "https://example.atlassian.net/board/1", name: "Sprint Board", type: "scrum" },
        { id: 2, self: "https://example.atlassian.net/board/2", name: "Kanban Board", type: "kanban" },
      ],
    };

    const result = transformBoards(raw);

    expect(result).toEqual([
      { id: 1, name: "Sprint Board", type: "scrum" },
      { id: 2, name: "Kanban Board", type: "kanban" },
    ]);
  });

  it("returns empty array when values is empty", () => {
    const raw: JiraApiBoardResponse = {
      maxResults: 50,
      startAt: 0,
      total: 0,
      isLast: true,
      values: [],
    };

    const result = transformBoards(raw);
    expect(result).toEqual([]);
  });

  it("does not include extra fields from raw response", () => {
    const raw: JiraApiBoardResponse = {
      maxResults: 50,
      startAt: 0,
      total: 1,
      isLast: true,
      values: [
        { id: 5, self: "https://example.atlassian.net/board/5", name: "Dev Board", type: "scrum" },
      ],
    };

    const result = transformBoards(raw);

    expect(Object.keys(result[0])).toEqual(["id", "name", "type"]);
  });
});

describe("transformIssues", () => {
  it("extracts key, summary, and status from raw issue response", () => {
    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 2,
      issues: [
        {
          id: "1001",
          key: "PROJ-1",
          self: "https://example.atlassian.net/issue/PROJ-1",
          fields: { summary: "Fix login bug", status: { name: "In Progress" } },
        },
        {
          id: "1002",
          key: "PROJ-2",
          self: "https://example.atlassian.net/issue/PROJ-2",
          fields: { summary: "Add logout", status: { name: "To Do" } },
        },
      ],
    };

    const result = transformIssues(raw);

    expect(result).toEqual([
      { key: "PROJ-1", summary: "Fix login bug", status: "In Progress" },
      { key: "PROJ-2", summary: "Add logout", status: "To Do" },
    ]);
  });

  it("returns empty array when issues is empty", () => {
    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 0,
      issues: [],
    };

    const result = transformIssues(raw);
    expect(result).toEqual([]);
  });

  it("caps output at 50 items when input exceeds 50", () => {
    const issues = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      key: `PROJ-${i}`,
      self: `https://example.atlassian.net/issue/PROJ-${i}`,
      fields: { summary: `Issue ${i}`, status: { name: "To Do" } },
    }));

    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 100,
      total: 100,
      issues,
    };

    const result = transformIssues(raw);

    expect(result).toHaveLength(50);
    expect(result[0].key).toBe("PROJ-0");
    expect(result[49].key).toBe("PROJ-49");
  });

  it("returns all items when input is exactly 50", () => {
    const issues = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      key: `PROJ-${i}`,
      self: `https://example.atlassian.net/issue/PROJ-${i}`,
      fields: { summary: `Issue ${i}`, status: { name: "Done" } },
    }));

    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 50,
      issues,
    };

    const result = transformIssues(raw);
    expect(result).toHaveLength(50);
  });

  it("returns all items when input is fewer than 50", () => {
    const issues = Array.from({ length: 10 }, (_, i) => ({
      id: `${i}`,
      key: `PROJ-${i}`,
      self: `https://example.atlassian.net/issue/PROJ-${i}`,
      fields: { summary: `Issue ${i}`, status: { name: "Done" } },
    }));

    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 10,
      issues,
    };

    const result = transformIssues(raw);
    expect(result).toHaveLength(10);
  });

  it("does not include extra fields from raw response", () => {
    const raw: JiraApiSearchResponse = {
      startAt: 0,
      maxResults: 50,
      total: 1,
      issues: [
        {
          id: "1001",
          key: "PROJ-1",
          self: "https://example.atlassian.net/issue/PROJ-1",
          fields: { summary: "Test issue", status: { name: "Open" } },
        },
      ],
    };

    const result = transformIssues(raw);

    expect(Object.keys(result[0])).toEqual(["key", "summary", "status"]);
  });
});
