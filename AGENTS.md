# AGENTS.md

Pragmatic playbook for this repo: **Next.js (App Router) + Supabase (SSR) + React Query + AG Grid Views**.

## Stack
- Next.js App Router (`src/app/*`)
- Supabase:
  - SSR auth via `@supabase/ssr`
  - JS client via `@supabase/supabase-js`
- Data fetching/caching:
  - `@tanstack/react-query`
  - `@supabase-cache-helpers/postgrest-react-query` for PostgREST + cache invalidation
- UI:
  - Tailwind CSS v4
  - Preline theme + variants (imported in `src/app/globals.css`)
  - Local UI kit components in `src/shared/ui/*`
- Tables: `ag-grid-community` + `ag-grid-react`

## Repo Layout (High Signal)
- `src/app/*`: routes, layouts, providers (React Query), server components
- `src/entities/*`: entity types + column defs (Invoices/Orders/Views)
- `src/features/*`: feature-level UI/model (auth, view selector)
- `src/widgets/ag-grid-table/*`: AG Grid widget + view persistence (client-side)
- `src/shared/lib/*`: cross-cutting utilities (Supabase clients, `cn`, RHF helpers)
- `src/shared/ui/*`: built-in UI kit (Button, Input, Select, PageHeader)
- `supabase/migrations/*`: schema + RLS policies (source of truth)
- `supabase/seed.sql`: generated seed (do not edit manually)
- `scripts/*`: one-command DB refresh, seed generator, MCP probe, etc.
- `tests/*`: Playwright E2E
- `.vscode/mcp.json`: MCP servers for AG Grid docs + Supabase

## Pages
- `/login`
- `/dashboard`
- `/invoices`
- `/orders`

## Quick Start
1. `npm i`
2. Create `.env.local` (copy from `.env.example`)
3. `npm run dev`

## Environment Variables
Required (runtime):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional (remote DB sync):
- `SUPABASE_DB_PASSWORD` (remote Postgres password for `npm run supabase:remote:sync`)

Optional (MCP Supabase server auth for `npm run mcp:probe`):
- `SUPABASE_ACCESS_TOKEN` (or `SUPABASE_MCP_TOKEN` / `SUPABASE_TOKEN`)

## UI Rules (Use the Built-In UI Kit)
Use the local UI kit first:
- Buttons: `src/shared/ui/button/Button.tsx`
- Forms: `src/shared/ui/form/Input.tsx`, `src/shared/ui/form/Select.tsx`
- Page header: `src/shared/ui/page/PageHeader.tsx`

Conventions:
- Use Tailwind classes + Preline theme tokens already used in the codebase.
- Use `cn()` (`src/shared/lib/cn.ts`) to merge class names.
- Prefer consistent primitives instead of importing new UI libraries.
- Forms use `react-hook-form` + `zod` helpers from `src/shared/lib/react-hook-form.ts`.

## Data Layer Rules (Supabase + React Query)
General pattern used in this repo:
- Server Components fetch initial rows on the server using the **server Supabase client**:
  - Example: `src/app/(protected)/invoices/page.tsx`
- Client components (AG Grid widget) manage interactive state and view persistence.
- Views CRUD is implemented using React Query + Supabase cache helpers:
  - `src/entities/view/api/react-query.ts` uses:
    - `useQuery` (PostgREST query builder)
    - `useInsertMutation` / `useUpdateMutation` / `useDeleteMutation`

Rules of thumb:
- Do not instantiate the Supabase browser client per render; memoize once per component (`useMemo(() => createClient(), [])`).
- Keep query/mutation logic in `entities/*/api/*` (not inside UI).
- Avoid `any`; keep entity types in `entities/*/model/types.ts`.

## Supabase SSR (Strict Templates)
This repo intentionally uses `@supabase/ssr` (no `auth-helpers-nextjs`).

1) Browser client (Client Components only):
- `src/shared/lib/supabase/browser.ts`
- Must be `createBrowserClient(url, key)` with no cookie adapter.

2) Server client (Server Components / Route Handlers):
- `src/shared/lib/supabase/server.ts`
- Must use the cookie adapter with **only** `getAll()` + `setAll()` (per project requirements).

3) Middleware proxy (Auth gate + cookie refresh):
- Implementation: `src/proxy.ts`
- This repo uses `src/proxy.ts` as the Next.js Middleware entrypoint.
- Do not add a separate `middleware.ts` that re-exports `config` (Next requires `config` to be declared in the middleware module itself).

## Database (Migrations + Seed)
Schema lives in `supabase/migrations/`:
- `supabase/migrations/20260206121440_init.sql`: tables `views`, `invoices`, `orders` + RLS for `views`
- `supabase/migrations/20260208123000_fix_views_update_policy.sql`: fixes UPDATE policy (`WITH CHECK`)

Seed:
- Sources: `invoices.json`, `orders.json`
- Generator: `scripts/generate-seed-from-json.mjs`
- Output: `supabase/seed.sql`

Important:
- `supabase/seed.sql` contains `truncate table public.invoices, public.orders;`
  so seeding **overwrites** demo data.

## Refresh Data (One Command)
For testers (copy/paste):
> I update `invoices.json` / `orders.json` and run one command. It regenerates `supabase/seed.sql` and recreates the DB with fresh data.

Local (Supabase CLI + Docker Desktop required):
```bash
npm run db:refresh
```

If Supabase is already running:
```bash
node scripts/db-refresh.mjs --no-start
```

Remote (Supabase Cloud, no Docker):
Prereqs:
- `supabase login`
- `supabase link`
- Know the remote Postgres password (Project Settings -> Database)

```powershell
$env:SUPABASE_DB_PASSWORD="..."
npm run supabase:remote:sync
```

## MCP Servers (AG Grid + Supabase)
MCP is configured for VS Code in `.vscode/mcp.json`:
- `ag-mcp` (stdio): AG Grid docs/search for the detected AG Grid version in this repo
- `supabase` (http): Supabase MCP endpoint for the configured `project_ref`

Probe connectivity/tools:
```bash
npm run mcp:probe
```

Notes:
- `ag-mcp` works without credentials.
- `supabase` MCP requires an access token:
  - set `SUPABASE_ACCESS_TOKEN` (or `SUPABASE_MCP_TOKEN` / `SUPABASE_TOKEN`)

## Tests
Playwright:
```bash
npm run test:e2e
```

