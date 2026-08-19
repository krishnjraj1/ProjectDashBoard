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

- JIRA REST API — accessed via Next.js server-side API routes
- API tokens stored server-side only (never exposed to the client)

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
```

## Development Environment

- OS: macOS
- Shell: zsh
- Node.js: v18+ (LTS recommended)

## Architecture Notes

- API routes act as a proxy to JIRA — handle caching and data transformation
- Keep JIRA responses slim: transform verbose API payloads before sending to the client
- Use server-side caching to respect JIRA rate limits
