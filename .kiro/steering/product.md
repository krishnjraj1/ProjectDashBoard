# Product Overview

ProjectDashBoard is a web-based application that provides two complementary ways to interact with JIRA project data:

1. **Visual Dashboard** — at-a-glance charts, metrics, and status views
2. **Conversational Chat** — natural language Q&A powered by an LLM with JIRA tool access

## Purpose

- Provide a simplified, visual summary of JIRA project data
- Surface key metrics: sprint progress, issue status breakdown, blockers, and velocity
- Enable natural language queries against JIRA data via a chat interface
- Reduce context-switching by centralizing project visibility in one page

## Data Source

- All project data is fetched from JIRA via the JIRA REST API
- Dashboard reflects near-real-time state of JIRA boards and projects
- Chat uses LLM tool-calling to query JIRA dynamically based on user questions

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
- LLM invokes JIRA tools dynamically to answer queries
- Context-aware follow-up questions within a session
- Embedded alongside the dashboard for unified experience

## Development Phases

1. Project setup and JIRA API connection
2. Visual dashboard with charts and filters
3. UX polish and production readiness
4. Conversational chat with LLM + tool-use
5. Unified dashboard + chat integration
