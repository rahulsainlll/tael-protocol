# dashboard

The Tael dashboard — the primary product surface (Next.js 15, App Router). Consumes `@tael/ui` for
shared components and `@tael/auth` for Sign-In-With-Stellar. UI sections are scaffolded (feature-module
boundaries, no live data yet); **auth is real**.

## Structure

```
app/
  layout.tsx            # root: theme provider + @tael/ui/globals.css
  (auth)/               # unauthenticated shell — connect-wallet login / signup
  (dashboard)/          # authenticated app shell (Sidebar + Topbar) + all sections
  api/auth/             # challenge · verify · logout route handlers (Node runtime)
middleware.ts           # verifies the session JWT (edge, jose) → redirects to /login
components/             # app-shell (sidebar/topbar/theme-toggle) + PageHeader / EmptyState / StatCard
features/               # domain boundaries — auth (wallet connect), marketplace, wallet, navigation
lib/                    # auth.ts (getSession), config.ts (AUTH_SECRET), api.ts (API base URL)
```

## Auth — Sign-In-With-Stellar

The wallet is the identity (no passwords, no database):

1. **Connect** a Stellar wallet (Stellar Wallets Kit — Freighter/Albedo/xBull).
2. `GET /api/auth/challenge` issues a message; the wallet **signs** it.
3. `POST /api/auth/verify` checks the signature (`@tael/stellar`) and sets an httpOnly session JWT
   (`@tael/auth`).
4. `middleware.ts` verifies that JWT on the **edge runtime** — jose only, never the Stellar SDK.

Set `AUTH_SECRET` (session signing secret) and `NEXT_PUBLIC_STELLAR_NETWORK` in the environment.

## Run

```bash
pnpm --filter dashboard dev     # http://localhost:3002  → redirects to /login
```

Requires a Stellar wallet extension (e.g. Freighter) with a testnet account to sign in.
