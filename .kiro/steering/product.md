# Product Overview

ProjectDashBoard is a web-based application that provides two complementary ways to interact with JIRA project data:

1. **Visual Dashboard** — at-a-glance charts, metrics, and status views
2. **Conversational Chat** — natural language Q&A powered by an AI agent with MCP-based JIRA tool access

## Purpose

- Provide a simplified, visual summary of JIRA project data
- Surface key metrics: sprint progress, issue status breakdown, blockers, and velocity
- Enable natural language queries against JIRA data via a chat interface
- Reduce context-switching by centralizing project visibility in one page

## Data Source

- All project data is fetched from JIRA via the JIRA REST API
- Dashboard reflects near-real-time state of JIRA boards and projects
- Chat uses an MCP Server that exposes JIRA operations as discoverable tools, invoked dynamically by an AI agent

## Target Users

- Project managers tracking delivery progress
- Engineering leads monitoring team workload and blockers
- Stakeholders needing high-level status without JIRA access

## Key Capabilities

### Dashboard (Phase 1-3)
- Sprint progress and burndown overview
- Issue status distribution (To Do, In Progress, Done, Blocked)
- Assignee workload summary
- Overdue and at-risk item highlights
- Filterable by project, sprint, or team

### Conversational Chat (Phase 4-5)
- Ask questions about JIRA data in natural language
- AI agent uses an MCP Client to connect to a JIRA MCP Server
- MCP Server exposes JIRA operations as tools (get_projects, search_issues, get_sprint_status, etc.)
- Agent discovers and invokes tools dynamically via the MCP protocol
- Context-aware follow-up questions within a session
- Embedded alongside the dashboard for unified experience

## Architecture Overview

### Phase 1-3: Dashboard
```
Browser → Next.js API Routes (proxy) → JIRA REST API
```

### Phase 4-5: Chat
```
Browser → /api/chat → AI Agent + MCP Client → MCP Server (JIRA) → JIRA REST API
```

The JIRA service layer (auth, caching, data transformation) is shared between the dashboard API routes and the MCP Server.

## Development Phases

1. Project setup and JIRA API connection
2. Visual dashboard with charts and filters
3. UX polish and production readiness
4. Conversational chat with AI agent + MCP Client/Server
5. Unified dashboard + chat integration
