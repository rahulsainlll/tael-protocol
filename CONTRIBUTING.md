# Contributing to Tael

Thanks for helping build the payment layer for autonomous AI agents. This guide covers the local
setup and the conventions we hold to. For _why_ the repo is shaped the way it is, read
[ARCHITECTURE.md](./ARCHITECTURE.md).

## Prerequisites

- **Node** ≥ 22 (`.node-version` pins the exact version — use `nvm`/`fnm`)
- **pnpm** ≥ 11 (`corepack enable` will provision the pinned version)

## Setup

```bash
git clone <repo> && cd tael-protocol
corepack enable
pnpm install
cp .env.example .env      # fill in as needed; defaults work for local dev
```

## Everyday commands

Run from the repo root:

| Command          | What it does                                        |
| ---------------- | --------------------------------------------------- |
| `pnpm dev`       | Run every app in watch mode (no build step needed)  |
| `pnpm build`     | Build all packages + apps                           |
| `pnpm test`      | Run all Vitest suites                               |
| `pnpm typecheck` | Type-check every workspace                          |
| `pnpm lint`      | ESLint across the repo (`pnpm lint:fix` to autofix) |
| `pnpm format`    | Prettier write (`pnpm format:check` to verify)      |

Scope to one workspace with `--filter`:

```bash
pnpm --filter @tael/api dev        # start just the API (tsx watch)
pnpm --filter web dev              # start just the website
pnpm --filter @tael/payments test   # test one package
```

## Where does my code go?

- **New shared type / schema / value object** → `packages/types`
- **x402 protocol change** → `packages/payments`
- **Anything Stellar/Soroban** → `packages/stellar`
- **Developer SDK ergonomics** → `packages/sdk`
- **A shared UI component** → `packages/ui`
- **New backend capability** → a feature module in `apps/api/src/modules/<domain>/`
- **A dashboard section / feature** → `apps/dashboard` (`features/<domain>` + a thin page)
- **Marketing page** → `apps/web/app`
- **A brand-new capability that two workspaces share** → a new `packages/*` (see the
  [Deferred workspaces](./ARCHITECTURE.md#deferred-workspaces) table — don't create empty packages)

## Adding a backend domain (DDD)

Create `apps/api/src/modules/<domain>/` with four files — `schema`, `repository` (port + in-memory
adapter), `service`, `router` — then register the router in `src/trpc/router.ts` and wire the service
in `src/container.ts`. Mirror the existing `wallets` module.

## Conventions

- **TypeScript strict**; no deep imports (import a package by its name, not its `src`).
- **Validate at the edges** with zod; throw `TaelError` with a `code`, never a bare `Error`.
- **Files** kebab-case; React components PascalCase; module files `<domain>.<role>.ts`.
- **Prefer `import type`** for type-only imports.

## Commits & PRs

- **Conventional Commits**: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.
- Before pushing: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (CI runs the same).
- **Changed a published `@tael/*` package?** Add a changeset: `pnpm changeset`.
- Open a PR against `main` and fill in the template. Keep PRs focused.

## Releasing

Releases are automated via [Changesets](https://github.com/changesets/changesets). Merging changesets
to `main` opens a "Version Packages" PR; merging that publishes. You don't publish manually.
