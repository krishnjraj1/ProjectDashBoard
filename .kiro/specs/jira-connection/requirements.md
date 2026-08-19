# Requirements Document

## Introduction

This feature establishes the foundational infrastructure for ProjectDashBoard: scaffolding a Next.js project with TypeScript and Tailwind CSS, creating a server-side JIRA API proxy with secure authentication, and displaying raw JIRA data to verify end-to-end connectivity. This is Phase 1 of the project, proving the connection pipeline works before building visual dashboards on top.

## Glossary

- **App**: The Next.js web application serving as the ProjectDashBoard frontend and backend
- **API_Proxy**: A Next.js App Router route handler that forwards requests to the JIRA REST API on behalf of the client
- **JIRA_API**: The Atlassian JIRA REST API (v2 or v3) used to retrieve project, board, and issue data
- **API_Token**: An Atlassian API token used for authentication, stored exclusively in server-side environment variables
- **Connection_Page**: A page in the App that displays raw JIRA data to verify successful API connectivity
- **Project**: A JIRA project entity containing issues and boards
- **Board**: A JIRA board entity associated with a project (Scrum or Kanban)
- **Issue**: A JIRA issue entity representing a work item (story, task, bug, etc.)

## Requirements

### Requirement 1: Project Scaffolding

**User Story:** As a developer, I want a properly scaffolded Next.js project with TypeScript and Tailwind CSS, so that I have a reliable foundation to build the dashboard upon.

#### Acceptance Criteria

1. THE App SHALL use the Next.js App Router architecture with TypeScript enabled, evidenced by an `app/` directory containing a root layout file (`layout.tsx`), and a `tsconfig.json` file present at the project root
2. THE App SHALL include Tailwind CSS with a `tailwind.config.ts` file at the project root, and Tailwind utility classes SHALL render correctly when applied to elements in the root layout or default page
3. THE App SHALL include a valid `package.json` that lists Next.js, React, TypeScript, and Tailwind CSS as dependencies
4. WHEN `npm install` is executed, THE App SHALL install all dependencies and complete with exit code 0
5. WHEN `npm run dev` is executed, THE App SHALL start a development server that is responsive to HTTP requests within 30 seconds without emitting errors to stderr
6. WHEN `npm run build` is executed, THE App SHALL produce a production build that completes with exit code 0

### Requirement 2: Environment Configuration for JIRA Credentials

**User Story:** As a developer, I want JIRA credentials stored securely in server-side environment variables, so that API tokens are never exposed to the client.

#### Acceptance Criteria

1. THE App SHALL read JIRA credentials from server-side environment variables: `JIRA_BASE_URL` (validated as a non-empty URL starting with `https://`), `JIRA_EMAIL` (validated as non-empty), and `JIRA_API_TOKEN` (validated as non-empty)
2. THE App SHALL include a `.env.local.example` file containing placeholder keys (`JIRA_BASE_URL=`, `JIRA_EMAIL=`, `JIRA_API_TOKEN=`) with descriptive comments explaining expected values
3. THE App SHALL exclude `.env.local` from version control via a `.gitignore` entry
4. IF any required JIRA environment variable is missing or set to an empty string, THEN THE API_Proxy SHALL return an HTTP 500 response with a JSON body containing an `error` field that names the missing or empty variable
5. THE App SHALL NOT include JIRA credentials in any client-side JavaScript bundle; credentials SHALL only be accessible in server-side code (API route handlers)

### Requirement 3: JIRA API Proxy Route

**User Story:** As a developer, I want a server-side API proxy that handles JIRA authentication, so that the client can request JIRA data without directly accessing the JIRA API or possessing credentials.

#### Acceptance Criteria

1. THE API_Proxy SHALL expose a route at `/api/jira/projects` that returns a JSON array of accessible JIRA projects, where each project object includes at minimum the project key and name
2. THE API_Proxy SHALL expose a route at `/api/jira/boards` that returns a JSON array of accessible JIRA boards, where each board object includes at minimum the board name and type
3. THE API_Proxy SHALL expose a route at `/api/jira/issues` that accepts a `projectKey` query parameter and returns a maximum of 50 issues per request for the specified project, where each issue object includes at minimum the issue key, summary, and status
4. THE API_Proxy SHALL authenticate with the JIRA_API using HTTP Basic Authentication with the configured email and API_Token
5. THE API_Proxy SHALL set the `Content-Type` response header to `application/json` for all successful responses
6. IF the JIRA_API returns an HTTP error status, THEN THE API_Proxy SHALL return the same status code to the client with a JSON body containing an `error` field that includes the error message from the JIRA_API response
7. IF the JIRA_API is unreachable or does not respond within 10 seconds, THEN THE API_Proxy SHALL return an HTTP 502 response with a JSON body containing an `error` field describing the connectivity failure
8. WHEN a request is received without a required query parameter, THE API_Proxy SHALL return an HTTP 400 response with a JSON body containing an `error` field specifying the name of the missing parameter

### Requirement 4: Fetch and Display JIRA Projects

**User Story:** As a developer, I want to see a list of JIRA projects rendered on a page, so that I can verify the API proxy successfully retrieves project data.

#### Acceptance Criteria

1. WHEN the Connection_Page loads, THE App SHALL fetch the list of projects from the `/api/jira/projects` route
2. WHEN project data is successfully retrieved, THE Connection_Page SHALL display each project's key and name in a list or table format
3. WHILE the project data is being fetched, THE Connection_Page SHALL display a visible loading indicator (spinner or skeleton)
4. IF the project fetch fails, THEN THE Connection_Page SHALL display the error message returned by the API_Proxy in a visually distinct error container
5. IF the project list is empty (zero projects returned), THEN THE Connection_Page SHALL display a message indicating no projects were found

### Requirement 5: Fetch and Display JIRA Boards

**User Story:** As a developer, I want to see a list of JIRA boards rendered on a page, so that I can verify the API proxy successfully retrieves board data.

#### Acceptance Criteria

1. WHEN the Connection_Page loads, THE App SHALL fetch the list of boards from the `/api/jira/boards` route
2. WHEN board data is successfully retrieved, THE Connection_Page SHALL display each board's name and type in a list or table format
3. WHILE the board data is being fetched, THE Connection_Page SHALL display a visible loading indicator (spinner or skeleton)
4. IF the board fetch fails, THEN THE Connection_Page SHALL display the error message returned by the API_Proxy in a visually distinct error container
5. IF the board list is empty (zero boards returned), THEN THE Connection_Page SHALL display a message indicating no boards were found

### Requirement 6: Fetch and Display JIRA Issues

**User Story:** As a developer, I want to see JIRA issues for a selected project rendered on a page, so that I can verify the API proxy successfully retrieves issue data.

#### Acceptance Criteria

1. WHEN a project is selected on the Connection_Page, THE App SHALL fetch issues from the `/api/jira/issues` route using that project's key, returning a maximum of 50 issues per request
2. WHEN issue data is successfully retrieved, THE Connection_Page SHALL display each issue's key, summary, and status in a list or table format
3. WHILE the issue data is being fetched, THE Connection_Page SHALL display a visible loading indicator (spinner or skeleton)
4. IF the issue fetch fails, THEN THE Connection_Page SHALL display the error message returned by the API_Proxy in a visually distinct error container
5. WHEN no project is selected, THE Connection_Page SHALL display a prompt instructing the user to select a project before issues can be displayed
6. IF the issue list is empty (zero issues returned for the selected project), THEN THE Connection_Page SHALL display a message indicating no issues were found for that project

### Requirement 7: Connection Status Indicator

**User Story:** As a developer, I want a clear indicator of whether the JIRA connection is healthy, so that I can quickly tell if the integration is working.

#### Acceptance Criteria

1. WHEN the Connection_Page loads, THE App SHALL attempt a test request to the `/api/jira/projects` route with a timeout of 10 seconds
2. WHILE the test request is in progress, THE Connection_Page SHALL display a status badge indicating that the connection check is in progress
3. WHEN the test request returns an HTTP 2xx response within the timeout period, THE Connection_Page SHALL display a green status badge with the text "Connected"
4. IF the test request returns a non-2xx response, a network error, or exceeds the 10-second timeout, THEN THE Connection_Page SHALL display a red status badge with the text "Disconnected"
5. THE Connection_Page SHALL display the configured JIRA base URL (without credentials) alongside the status badge
