# Roadmap

Delivered in **phases** — scaffold only what's needed now, document the rest. No placeholder packages
(see [`principles.md`](./principles.md)).

## Phase 1 — Foundation ✅ (done)

The core of the payment flow.

- **Packages:** `config`, `types` (domain kernel), `payments` (x402), `stellar` (settlement), `sdk`
  (the `tael({ price, handler })` wrapper).
- **Apps:** `api` (Hono + tRPC modular monolith, DDD), `web` (marketing site).
- Enables: x402, Stellar settlement, the SDK, the payment flow, the landing page.

## Phase 2 — Dashboard & shared UI ✅ (done)

The product surface.

- **App:** `dashboard` (Next.js 15) — route groups, auth middleware shell, feature modules, sections
  for Overview, Wallet, Marketplace, My Capabilities, My Agents, Analytics, Payments, Reviews,
  Organizations, API Keys, Settings.
- **Package:** `ui` (`@tael/ui`) — shared shadcn/ui components.
- Renamed `@tael/payment` → `@tael/payments` (it grows into x402 / verification / receipts / fees /
  pricing / sessions / facilitator).

## Phase 3 — Real flows (next)

Turn the architecture into working product. Only build a package when it's actually needed.

- **`packages/database`** — Drizzle schema + Postgres adapter behind the API's existing repository
  ports (users, wallets, capabilities, payments, reviews, organizations, policies).
- **`packages/auth`** — Better Auth + passkeys, replacing the dashboard's cookie stub.
- **Wire the dashboard to the API** — typed tRPC client for the first real data flows.
- Then implement the [five success flows](./goals.md#success-criteria--the-five-end-to-end-flows).

## Later

- **Apps:** `docs`, `explorer` (capability explorer), `playground` (payment sandbox).
- **Packages:** `mcp` (MCP wrapper), `agent` (agent client), `analytics`, `policy-engine`, `search`.
- **`contracts/`** — Soroban contracts (wallet / policy / treasury / settlement); the on-chain
  settlement adapter slots in behind `@tael/stellar` with no caller changes.
- Mainnet.

## Target shape (~12–15 packages, no more)

```
apps/      web · dashboard · api · docs
packages/  sdk · payments · stellar · database · auth · ui · types ·
           marketplace · mcp · agent · analytics · search
contracts/ wallet · policy · settlement · treasury
```
