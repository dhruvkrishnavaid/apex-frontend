# Apex Frontend: Agile Backlog

React 19 + TanStack Router + Tailwind CSS 4 + shadcn/ui, talking to the Apex backend (`/api/v1`, JWT bearer).
Backend API reference: `apex-backend/docs/API.md`. Delivered in short sprints; each sprint is one or more commits
named `Sprint N: ...`. Mobile-first and responsive throughout; permission-aware navigation (RBAC from the JWT user).

## Epics

| # | Epic | Backend area |
|---|------|--------------|
| F1 | Foundation & design system | Tailwind, shadcn, fontsource, theme, API client |
| F2 | Identity & access | Login, session refresh, route guards, users, roles, profile |
| F3 | Dashboard & reports | Dashboard KPIs, stock valuation, sales, top products |
| F4 | Catalogue | Categories, products, variants, barcodes |
| F5 | Inventory & warehouses | Stock levels, movements, adjustments, transfers, warehouses |
| F6 | Procurement | Suppliers, purchase orders, goods receipt |
| F7 | Sales & fulfilment | Customers, orders, pick/pack/ship, returns |
| F8 | Alerts & audit | Alerts, reorder rules, suggestions, audit log |

## Definition of done
- Typechecks and `bun run build` passes.
- Works at 375px and desktop widths; keyboard accessible; light and dark themes.
- Respects permissions (hidden nav, guarded routes, disabled actions).
- Committed with a sprint-scoped message.

## Sprints

| Sprint | Epic | Goal | Status |
|--------|------|------|--------|
| 0 | F1 | Project scaffold (Vite, TanStack Router, Tailwind) | Done |
| 1 | F1 | Tailwind theme, shadcn/ui, fontsource fonts, typed API client, query client | Done |
| 2 | F2 | Login, token storage and refresh, route guards, permission helpers | Done |
| 3 | F1, F2 | Responsive app shell: sidebar, mobile sheet nav, header, theme toggle, user menu | Done |
| 4 | F3 | Dashboard KPIs, sales trend, top products, open alerts | Planned |
| 5 | F4 | Products list with search/filter/paging, product detail with variants | Planned |
| 6 | F5 | Stock levels, movement ledger, adjustments, warehouses | Planned |
| 7 | F8 | Alerts and replenishment suggestions | Planned |
| 8 | F7 | Sales orders list/detail and fulfilment actions | Planned |
| 9 | F6 | Suppliers and purchase orders | Planned |
| 10 | F2, F8 | Users, roles, audit log | Planned |

## Backlog (stories)

- F1: As a developer I have a typed API client that attaches the token, refreshes on 401, and surfaces `{status,message}` errors.
- F2: As a user I can sign in, stay signed in across reloads, and be redirected to login when my session ends.
- F2: As a user I only see navigation and actions I have permission for.
- F3: As a manager I see today's orders and revenue, stock value and open alerts at a glance.
- F4: As staff I can search products by keyword/category and open a product to see variants, prices and barcodes.
- F5: As warehouse staff I can see stock per warehouse, review the movement ledger and record an adjustment.
- F8: As a manager I can see open alerts and replenishment suggestions.
- F7: As staff I can follow an order through pick, pack, ship and deliver.
- F6: As a buyer I can see purchase orders and their receipt progress.
- F2: As an admin I can manage users and roles; F8: review the audit trail.
