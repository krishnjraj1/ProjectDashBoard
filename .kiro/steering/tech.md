# Tech Stack

## Framework

- Next.js (App Router) — React framework with built-in API routes and SSR support

## Language

- TypeScript

## UI & Styling

- Tailwind CSS — utility-first CSS framework
- shadcn/ui — accessible, composable component library

## Charts & Visualization

- Recharts — lightweight charting library built for React

## Data Source

- JIRA REST API — accessed via Next.js server-side API routes (Phase 1-3)
- JIRA MCP Server — exposes JIRA operations as MCP tools for the chat agent (Phase 4-5)
- API tokens stored server-side only (never exposed to the client)

## AI & Agent Layer (Phase 4-5)

- LLM Provider: Claude or OpenAI (tool-use capable model)
- MCP Client: SDK integrated into the Next.js backend to discover and invoke tools
- MCP Server (JIRA): Separate process that wraps JIRA operations as MCP-compliant tools
- Protocol: Model Context Protocol (JSON-RPC over stdio or HTTP)
- Tools exposed: get_projects, get_boards, search_issues, get_sprint_status, get_assignee_workload, get_issue_details

## Build System

- Next.js (built on Webpack/Turbopack)
- Package manager: npm

## Common Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Start MCP Server (Phase 4+)
# npm run mcp:server
```

## Development Environment

- OS: macOS
- Shell: zsh
- Node.js: v18+ (LTS recommended)

## Architecture Notes

- API routes act as a proxy to JIRA — handle caching and data transformation (Phase 1-3)
- Keep JIRA responses slim: transform verbose API payloads before sending to the client
- Use server-side caching to respect JIRA rate limits
- JIRA service layer (auth, cache, transform) is shared between dashboard routes and MCP Server
- MCP Server runs as a separate process, exposing tools the AI agent can discover dynamically
- MCP Client in the backend orchestrates agent ↔ tool communication via the MCP protocol
