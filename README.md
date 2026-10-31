# Apex Frontend

Responsive web client for the Apex retail inventory backend (`apex-backend`, Spring Boot, `/api/v1`, JWT).

Stack: React 19, Vite, TanStack Router (file routes) + Query, Tailwind CSS 4, shadcn/ui (Radix, lucide icons),
fonts via `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`.

## Run

```bash
cp .env.example .env   # VITE_API_URL, default http://localhost:8080/api/v1
bun install
bun run dev            # http://localhost:3000
bun run build
```

The backend must allow `http://localhost:3000` in `CORS_ALLOWED_ORIGINS`.

## Structure

- `src/routes`: file routes. `_authenticated/` holds every page behind the login guard.
- `src/auth.tsx`: session state, `can(...permissions)`; tokens persist in localStorage and refresh on 401 (`src/lib/api.ts`).
- `src/lib/queries.ts`: TanStack Query options per endpoint; `src/lib/types.ts` mirrors backend DTOs.
- `src/components/ui`: shadcn components (add more with `bunx shadcn@latest add <name>`).
- `src/components/layout/nav.ts`: navigation; items are hidden without the listed permissions.

## Delivery

Agile, sprint by sprint: see [docs/AGILE_BACKLOG.md](docs/AGILE_BACKLOG.md). Sprints 0 to 10 are done (foundation, auth,
app shell, dashboard, products, inventory, alerts, orders, procurement, users/roles, audit log). Create/edit forms are next.
