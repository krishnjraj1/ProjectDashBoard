/**
 * JIRA types and transformation functions.
 *
 * Defines the slim interfaces used throughout the application and provides
 * transformation functions that extract only the needed fields from raw
 * JIRA API responses. This module is framework-independent.
 */

// --- Application Interfaces ---

export interface JiraProject {
  key: string;
  name: string;
}

export interface JiraBoard {
  id: number;
  name: string;
  type: string; // "scrum" | "kanban"
}

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
}

export interface HealthStatus {
  status: "connected" | "disconnected";
  baseUrl?: string;
  error?: string;
}

// --- Raw JIRA API Response Shapes ---

export interface JiraApiProject {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
}

export interface JiraApiBoardResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: JiraApiBoard[];
}

export interface JiraApiBoard {
  id: number;
  self: string;
  name: string;
  type: string;
}

export interface JiraApiSearchResponse {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraApiIssue[];
}

export interface JiraApiIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: { name: string };
  };
}

// --- Transformation Functions ---

/**
 * Transforms raw JIRA project API responses to slim JiraProject objects.
 * Extracts only the `key` and `name` fields.
 */
export function transformProjects(raw: JiraApiProject[]): JiraProject[] {
  return raw.map((project) => ({
    key: project.key,
    name: project.name,
  }));
}

/**
 * Transforms raw JIRA board API response to slim JiraBoard objects.
 * Extracts only the `id`, `name`, and `type` fields from `raw.values`.
 */
export function transformBoards(raw: JiraApiBoardResponse): JiraBoard[] {
  return raw.values.map((board) => ({
    id: board.id,
    name: board.name,
    type: board.type,
  }));
}

/**
 * Transforms raw JIRA search API response to slim JiraIssue objects.
 * Extracts `key`, `summary` (from fields.summary), and `status` (from fields.status.name).
 * Caps output at 50 items maximum (Phase 1 display cap).
 */
export function transformIssues(raw: JiraApiSearchResponse): JiraIssue[] {
  const issues = raw.issues.slice(0, 50);
  return issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
  }));
}
