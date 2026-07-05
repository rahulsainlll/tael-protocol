# @tael/api

The Tael backend — a **modular monolith** built on Hono + tRPC. Not a fleet of microservices:
domains are modules, not deployments, so a 20-engineer team ships without cross-service overhead.

## Layout

```
src/
  index.ts          # entrypoint: parse env, build container, start the listener
  server.ts         # build the Hono app (mounts /health + /trpc) — no port binding
  env.ts            # zod-validated environment
  container.ts      # composition root: the one place concretes are wired
  trpc/             # tRPC init, context, root router
  modules/          # DDD feature modules — the business logic
    wallets/        #   schema · repository (port + in-memory) · service · router
    payments/
```

## Conventions

- **Feature modules, not layers.** Everything for a domain lives in its folder.
- **Depend on ports, not stores.** Services take a `*Repository` interface; the in-memory adapter is
  the default, Postgres (via `packages/database`) drops in at the composition root later.
- **Routers stay thin.** Validate input, delegate to the service, return the result.

## Composition

`container.ts` adapts `@tael/stellar` settlement into a `@tael/payments` `PaymentVerifier` — the one
spot where blockchain and payments meet. Dev/tests use a mock verifier; production uses Stellar.

## Run

```bash
pnpm --filter @tael/api dev     # tsx watch, no build step
curl localhost:3001/health
```
