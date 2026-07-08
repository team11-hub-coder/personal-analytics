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

## Critical: Next.js Version

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before writing any Next.js code, read the relevant guide in `node_modules/next/dist/docs/`. The `middleware` file convention is deprecated — the runtime warns about using `proxy` instead. Check the docs for the current approach.

---

## Tech Stack (MUST follow)

| Layer | Library | Where |
|-------|---------|-------|
| Framework | Next.js 16 (App Router) | Route groups: `(app)` = authenticated, `(auth)` = unauthenticated |
| Language | TypeScript strict | No `any`. All types in `types/` |
| Styling | Tailwind v4 | CSS-only config in `app/globals.css`, no tailwind.config.js |
| UI Components | shadcn/ui (base-nova) | `components/ui/` — always use these, never hand-roll |
| Charts | Recharts | `components/charts/` — use existing wrappers (ChartBar, ChartPie, ChartLine) |
| Forms | React Hook Form + Zod | Schemas in `lib/validations.ts`, types inferred from Zod |
| Server State | TanStack React Query | Custom hooks in `hooks/` — never fetch in page components |
| Client State | Zustand | `store/` — for UI state only (sidebar, theme) |
| Backend | Supabase | Client in `utils/supabase/client.ts`, server in `utils/supabase/server.ts` |
| Theme | `lib/theme.ts` | ALL colors, spacing, component styles from here — never hardcode |

---

## File Structure (MUST follow)

```
app/(app)/<module>/page.tsx          — Page component (UI only)
components/<module>/                 — Forms, lists, filters (UI only)
hooks/use<Module>.ts                 — TanStack Query + Supabase (data logic)
lib/<module>.ts                      — Data helper functions (optional)
lib/validations.ts                   — Add Zod schema here
types/index.ts                       — Add row interface here
```

---

## Rules (MUST follow)

### Styling Rules
- **NEVER hardcode colors** — always use `lib/theme.ts` tokens or CSS variables
- **NEVER hand-roll buttons/inputs/dialogs** — always use `components/ui/` (shadcn)
- **NEVER use inline styles** — always use Tailwind classes

### Data Rules
- **NEVER import Supabase client in page components** — always in `hooks/`
- **NEVER use `fetch()` or `axios`** — always use Supabase client
- **NEVER use `useState` for server data** — always use TanStack Query

### Type Rules
- **NEVER use `any`** — always define proper types
- All Supabase row interfaces go in `types/index.ts`
- All form validation schemas go in `lib/validations.ts`

### Component Rules
- **NEVER mix UI and data logic** — pages are UI only, hooks are data only
- Every list view MUST have skeleton loading (`Skeleton` from `components/ui/skeleton`) AND empty state
- Button clicks that trigger mutations MUST show spinner (`Loader2` from lucide-react with `animate-spin`)
- Use `"use client"` only when component uses hooks or browser APIs

### Performance Rules
- Use `useMemo` for expensive computations (filtering, sorting, aggregating large lists)
- Use `useCallback` for event handlers passed to child components
- TanStack Query handles caching — do NOT add manual caching
- Lazy load heavy components with `next/dynamic`

### Security Rules
- **NEVER expose `SUPABASE_SERVICE_ROLE_KEY`** — only in server-side code
- **NEVER trust client-side validation alone** — RLS policies are the real guard
- **NEVER put API keys in `NEXT_PUBLIC_` variables** — only `SUPABASE_URL` and `SUPABASE_ANON_KEY` are public

---

## Database

7 tables: `profiles`, `transactions`, `budgets`, `workouts`, `tasks`, `reminders`, `chat_messages`. Full schema and RLS policies are in `SETUP-GUIDE.md` (Step 5). The schema was frozen on Day 1.

## Environment Variables

`.env.local` (gitignored) — each teammate creates their own:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=server-side-only-never-commit
```

## Conventions

- Each person works on a `feature/*` branch; open a PR for review before merging to `main`.
- Schema changes go through the Lead to avoid breaking others' queries.
- Use the `@/` path alias (maps to project root).
