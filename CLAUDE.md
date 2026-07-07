# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal Analytics Dashboard — a 5-person team project tracking finance, workouts, tasks, reminders, and an AI chatbot. Built with Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase (Postgres, Auth, Realtime) + shadcn/ui.

## Commands

```bash
npm run dev          # Start dev server (Turbopack) at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (flat config, eslint-config-next)
```

No test runner is configured yet. Tests are planned for Week 2 of the sprint.

## Critical: Next.js Version

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. The `middleware` file convention is deprecated — the runtime warns about using `proxy` instead. Check the docs for the current approach.

## Architecture

### Data flow
- **Supabase** is the single backend: Postgres DB, Auth, and Realtime
- No separate API server — all data access goes through Supabase clients
- RLS (Row Level Security) is enabled on every table; each user sees only their own rows
- The Anthropic API key is server-side only, used in route handlers (e.g. `/api/chat`)

### Supabase clients
- `utils/supabase/client.ts` — browser components (createBrowserClient)
- `utils/supabase/server.ts` — server components & route handlers (createServerClient + cookies)
- `middleware.ts` — refreshes auth session on every request, redirects unauthenticated users to `/login`

### UI stack
- **Tailwind v4** — configured via CSS only (`app/globals.css`), no `tailwind.config.js`
- **shadcn/ui** (base-nova style) — components in `components/ui/`. Always use these, never hand-roll buttons/inputs/dialogs
- Charts: Recharts, planned wrappers in `components/charts/`

### Feature module pattern (from SETUP-GUIDE)
Each feature module follows this structure:
```
app/(app)/<module>/page.tsx   — the page
components/<module>/          — forms, lists, filters
lib/<module>.ts               — data functions (Supabase queries)
```

## Environment Variables

`.env.local` (gitignored) — each teammate creates their own:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=server-side-only-never-commit
```

## Conventions

- TypeScript strict mode. No `any`. Type Supabase rows.
- Use the `@/` path alias (maps to project root).
- Money as `numeric`, dates as ISO strings.
- Loading + empty states on every list view.
- Each person works on a `feature/*` branch; open a PR for review before merging to `main`.
- Schema changes go through the Lead to avoid breaking others' queries.

## Database

7 tables: `profiles`, `transactions`, `budgets`, `workouts`, `tasks`, `reminders`, `chat_messages`. Full schema and RLS policies are in `SETUP-GUIDE.md` (Step 5). The schema was frozen on Day 1.
