# Implementation Plan: JIRA Connection (Phase 1)

## Overview

This plan implements ProjectDashBoard Phase 1: scaffolding the Next.js project, building a server-side JIRA API proxy with secure authentication, and creating a connection verification page that displays raw JIRA data. The implementation proceeds bottom-up — project setup, then service layer, then API routes, then UI — ensuring each step builds on tested foundations.

## Tasks

- [x] 1. Scaffold Next.js project and configure tooling
  - [x] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
    - Run `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS, and ESLint enabled
    - Verify `app/` directory with `layout.tsx`, `tsconfig.json`, and `tailwind.config.ts` exist
    - Verify `package.json` lists Next.js, React, TypeScript, and Tailwind CSS as dependencies
    - Verify `npm run build` completes with exit code 0
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 1.2 Set up environment configuration and .gitignore
    - Create `.env.local.example` with placeholder keys: `JIRA_BASE_URL=`, `JIRA_EMAIL=`, `JIRA_API_TOKEN=` and descriptive comments
    - Ensure `.gitignore` excludes `.env.local`
    - _Requirements: 2.2, 2.3_

  - [x] 1.3 Set up Vitest and fast-check testing infrastructure
    - Install `vitest`, `@vitejs/plugin-react`, `fast-check`, and `@testing-library/react` as dev dependencies
    - Create `vitest.config.ts` at project root configured for TypeScript and React
    - Create `__tests__/unit/` and `__tests__/integration/` directories
    - Add a `test` script to `package.json` (`vitest --run`)
    - Verify `npm test` runs successfully (no tests yet, but exits cleanly)
    - _Requirements: 1.3_

- [x] 2. Implement JIRA service layer (`lib/jira/`)
  - [x] 2.1 Implement config validation module (`lib/jira/config.ts`)
    - Create `JiraConfig` interface with `baseUrl`, `email`, `apiToken` fields
    - Implement `validateConfig()` function that reads from `process.env`
    - Validate `JIRA_BASE_URL` starts with `https://`, `JIRA_EMAIL` is non-empty, `JIRA_API_TOKEN` is non-empty
    - Return structured error naming the first invalid/missing variable on failure
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 2.2 Write property test for config validation (Property 1)
    - **Property 1: Config validation correctness**
    - Generate arbitrary strings for URL/email/token including empty strings, whitespace, non-https URLs
    - Assert: returns valid config iff URL starts with `https://`, email non-empty, token non-empty; else returns error naming invalid variable
    - **Validates: Requirements 2.1, 2.4**

  - [x] 2.3 Implement auth header construction and JIRA client (`lib/jira/client.ts`)
    - Implement `createAuthHeader(email, apiToken)` producing `"Basic " + base64(email + ":" + token)`
    - Implement `jiraFetch<T>(path, options?)` using native `fetch` with `AbortController` (10s timeout)
    - Handle timeout (AbortError → 502), network errors (→ 502), and JIRA HTTP errors (→ sanitized)
    - _Requirements: 3.4, 3.7_

  - [x] 2.4 Write property test for auth header construction (Property 2)
    - **Property 2: Auth header construction**
    - Generate arbitrary non-empty strings for email and token
    - Assert: result equals `"Basic " + base64(email + ":" + token)` and decoding yields original `email:token`
    - **Validates: Requirements 3.4**

  - [x] 2.5 Implement error sanitization (`lib/jira/errors.ts`)
    - Create `SanitizedError` interface with `status` and `message` fields
    - Implement `sanitizeJiraError(jiraStatus, rawMessage)` mapping: 401→401, 403→403, 404→404, 429→429, 5xx→502
    - Use predefined message strings, never include raw JIRA response body
    - Log raw error details server-side at `warn` level
    - _Requirements: 3.6_

  - [x] 2.6 Write property test for sanitized error mapping (Property 4)
    - **Property 4: Sanitized error mapping**
    - Generate integer status codes in 400–599 range and arbitrary raw message strings
    - Assert: returned status matches expected mapping and returned message does NOT contain the raw JIRA message
    - **Validates: Requirements 3.6**

  - [x] 2.7 Implement projectKey validation (`lib/jira/validation.ts`)
    - Implement `isValidProjectKey(key)` validating against `/^[A-Z][A-Z0-9_]{1,9}$/`
    - Reject empty, lowercase, special characters, too-short (1 char), and too-long (>10 chars) keys
    - _Requirements: 3.8_

  - [x] 2.8 Write property test for parameter validation (Property 5)
    - **Property 5: Missing or invalid parameter validation**
    - Generate arbitrary strings including empty, lowercase, special chars, too-long, and valid keys
    - Assert: `isValidProjectKey` returns true only for strings matching `/^[A-Z][A-Z0-9_]{1,9}$/`
    - **Validates: Requirements 3.8**

  - [x] 2.9 Implement types and transformation functions (`lib/jira/types.ts`)
    - Define `JiraProject`, `JiraBoard`, `JiraIssue`, `HealthStatus` interfaces
    - Implement `transformProjects(raw)`, `transformBoards(raw)`, `transformIssues(raw)` extracting only needed fields
    - `transformIssues` caps output at 50 items maximum
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.10 Write property test for issue response capping (Property 3)
    - **Property 3: Issue response capping**
    - Generate arrays of 0–200 mock issue objects
    - Assert: output length ≤ 50 and each item contains exactly `key`, `summary`, `status` fields
    - **Validates: Requirements 3.3**

- [x] 3. Checkpoint — Verify service layer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement API route handlers (`app/api/jira/`)
  - [x] 4.1 Implement health endpoint (`app/api/jira/health/route.ts`)
    - Create GET handler that calls `GET /rest/api/3/myself` via `jiraFetch`
    - Return `{ status: "connected", baseUrl }` on success (200)
    - Return `{ status: "disconnected", error }` on failure (503)
    - Set `Content-Type: application/json`
    - _Requirements: 7.1, 7.3, 7.4, 7.5_

  - [x] 4.2 Implement projects endpoint (`app/api/jira/projects/route.ts`)
    - Create GET handler that calls `GET /rest/api/3/project` via `jiraFetch`
    - Transform response using `transformProjects` and return JSON array
    - Handle config validation errors (500), JIRA errors (mapped), and timeouts (502)
    - Set `Content-Type: application/json`
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.3 Implement boards endpoint (`app/api/jira/boards/route.ts`)
    - Create GET handler that calls `GET /rest/agile/1.0/board` via `jiraFetch`
    - Transform response using `transformBoards` and return JSON array
    - Handle config validation errors (500), JIRA errors (mapped), and timeouts (502)
    - Set `Content-Type: application/json`
    - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7_

  - [x] 4.4 Implement issues endpoint (`app/api/jira/issues/route.ts`)
    - Create GET handler that extracts `projectKey` query parameter
    - Validate `projectKey` with `isValidProjectKey` — return 400 if missing/invalid
    - Call `GET /rest/api/3/search?jql=project={key}&maxResults=50` via `jiraFetch`
    - Transform response using `transformIssues` and return JSON array
    - Handle config validation errors (500), JIRA errors (mapped), and timeouts (502)
    - Set `Content-Type: application/json`
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 4.5 Write unit tests for API route handlers
    - Test health endpoint returns connected/disconnected correctly
    - Test projects/boards endpoints transform and return data
    - Test issues endpoint validates projectKey and returns 400 for invalid input
    - Test config validation failure returns 500 with missing variable name
    - Test timeout handling returns 502
    - _Requirements: 2.4, 3.1, 3.2, 3.3, 3.6, 3.7, 3.8_

- [x] 5. Checkpoint — Verify API routes
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Connection Page UI
  - [x] 6.1 Implement StatusBadge component
    - Create client component that calls `GET /api/jira/health` on mount with 10s timeout
    - Display "Checking..." (neutral badge) while request is in progress
    - Display green badge with "Connected" on 2xx response
    - Display red badge with "Disconnected" on error/timeout
    - Display JIRA base URL (without credentials) alongside the badge
    - Style with Tailwind CSS
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 6.2 Implement ProjectsSection component
    - Create client component that fetches `GET /api/jira/projects` on mount
    - Display loading skeleton while fetching
    - Display each project's key and name in a table/list on success
    - Make project rows clickable to select a project (lift state to parent)
    - Display error message in red-bordered container on failure
    - Display "No projects found" message when array is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.3 Implement BoardsSection component
    - Create client component that fetches `GET /api/jira/boards` on mount
    - Display loading skeleton while fetching
    - Display each board's name and type in a table/list on success
    - Display error message in red-bordered container on failure
    - Display "No boards found" message when array is empty
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.4 Implement IssuesSection component
    - Create client component that accepts `selectedProjectKey` prop
    - Display "Select a project to view issues" prompt when no project selected
    - Fetch `GET /api/jira/issues?projectKey={key}` when project is selected
    - Display loading skeleton while fetching
    - Display each issue's key, summary, and status in a table/list on success
    - Display error message in red-bordered container on failure
    - Display "No issues found for this project" message when array is empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 6.5 Compose Connection Page (`app/page.tsx`)
    - Assemble `StatusBadge`, `ProjectsSection`, `BoardsSection`, and `IssuesSection` into main page
    - Manage `selectedProjectKey` state, pass to IssuesSection
    - Each section fetches independently; a failed section does not block others
    - Apply Tailwind CSS layout (responsive grid/stack)
    - _Requirements: 4.1, 5.1, 6.1, 7.1_

  - [x] 6.6 Write unit tests for UI components
    - **Property 6: Data rendering completeness** — verify rendered output contains all required fields for projects, boards, issues
    - **Property 7: Error message display** — verify error messages appear in visually distinct containers
    - Test loading states render skeleton/spinner
    - Test empty states render appropriate messages
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3, 6.4, 6.5, 6.6, 7.2, 7.3, 7.4**

- [x] 7. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The JIRA service layer is framework-independent, enabling reuse in Phase 4–5 MCP Server
- No external HTTP libraries needed — uses native `fetch` with `AbortController`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3"] },
    { "id": 2, "tasks": ["2.1", "2.3", "2.5", "2.7", "2.9"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6", "2.8", "2.10"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4"] },
    { "id": 5, "tasks": ["4.5"] },
    { "id": 6, "tasks": ["6.1", "6.2", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.5"] },
    { "id": 8, "tasks": ["6.6"] }
  ]
}
```
