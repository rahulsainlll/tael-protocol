# Principles

The quality bar and the rules that keep Tael maintainable as it grows toward 20+ engineers. Think
Vercel / Trigger.dev / Supabase / Better Auth / shadcn — **production-grade open source, not
hackathon**.

## Package discipline — the npm test

> Every package must answer **"would I publish this to npm?"** If the answer is "no," it probably
> doesn't deserve to be its own package.

- **No junk-drawer packages.** Never create `utils`, `common`, `helpers`, `lib`, `core`, or `shared`.
  They become dumping grounds.
- **One clear responsibility per package**, nameable in a sentence, with at least one real consumer.
- **No placeholder packages.** Build a package only when it's actually needed; document the rest as
  deferred (see [`roadmap.md`](./roadmap.md)) with a clear trigger for creation.
- Extract shared code when duplication is **real**, not anticipated (e.g. `@tael/ui` appeared only
  when a second frontend needed it).

## Architecture

- **Domain-Driven & feature-first.** Organize by domain (wallets, payments), not by technical layer.
- **Modular monolith, not microservices.** Domains are modules inside one deployable API; add
  services only when scaling truly demands it.
- **Depend on ports, not implementations.** Services take interfaces; concretes are wired in one
  composition root. Persistence, auth, and settlement swap without touching business logic.
- **Clear separation of concerns:** infrastructure · blockchain · payments · SDKs · frontend ·
  business logic each live in distinct, independently-testable units.
- **Minimal abstractions.** No indirection until a second consumer forces it.

## Engineering

- **Great DX & fast local dev** — zero build step for local development; one command runs everything.
- **Strict TypeScript**, validation (zod) at every external boundary, a single error taxonomy.
- **Verified green** — every change passes `format · lint · typecheck · test · build`, plus a real
  runtime smoke test, before it's considered done.
- **Deliver in phases**; plan with the user before large scaffolds.

## Product

- **Non-custodial and policy-bound** always (see [`goals.md`](./goals.md#non-negotiables)).
- **Machine-native**: instant settlement, micropayments, programmable limits — built for software.
