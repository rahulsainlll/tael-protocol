# dashboard

The Tael dashboard — the primary product surface (Next.js 15, App Router). Consumes `@tael/ui` for
shared components. **Architecture only right now**: routing, layouts, feature-module boundaries, and
an auth shell — no business logic or live data.

## Structure

```
app/
  layout.tsx            # root: theme provider + @tael/ui/globals.css
  (auth)/               # unauthenticated shell — login, signup
  (dashboard)/          # authenticated app shell (Sidebar + Topbar) + all sections
middleware.ts           # gates (dashboard) behind a session cookie → redirects to /login
components/             # app-shell (sidebar/topbar/theme-toggle) + PageHeader / EmptyState / StatCard
features/               # domain component boundaries (marketplace, wallet, navigation)
lib/                    # auth.ts (session stub), api.ts (API base-URL boundary)
```

## Conventions

- **Route groups** separate the auth and app shells; a shared `(dashboard)/layout.tsx` renders the
  sidebar + topbar around every section.
- **Feature modules** (`features/<domain>`) mirror the API's DDD modules — presentational boundaries,
  not business logic. Pages under `app/(dashboard)/<section>` stay thin.
- **Auth is a stub:** the demo login sets a `tael_session` cookie; `middleware.ts` enforces it. This
  is replaced by `@tael/auth` (Better Auth + passkeys) later — no logic here to unpick.

## Run

```bash
pnpm --filter dashboard dev     # http://localhost:3002  → redirects to /login
```

Sign in with any values (demo), click through the sidebar, and toggle the theme in the top bar.
