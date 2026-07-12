# @tael/database

The persistence layer — Drizzle ORM over PostgreSQL (Supabase). Single source of truth for
everything the system stores.

## Why a database (in a web3 project)

The **chain settles money**; it can't hold **secrets** or **queryable data**. A published capability
carries the developer's real upstream URL + API key (private, mutable → can't go on-chain), and the
marketplace needs search/sort. So: Stellar for settlement, Postgres for the private/searchable data.

## Schema

| Table          | Purpose                                                                     |
| -------------- | --------------------------------------------------------------------------- |
| `users`        | Identity = Stellar wallet address                                           |
| `wallets`      | User/agent funding wallets (+ cached balance)                               |
| `capabilities` | Published APIs/MCP/agents — incl. private `upstream_url` + encrypted secret |
| `agents`       | Autonomous agents + spending policy (JSONB)                                 |
| `payments`     | x402 settlement ledger (immutable history)                                  |
| `api_keys`     | Programmatic access (hashed)                                                |

Conventions: UUID PKs, `timestamptz` audit columns, native Postgres enums, FKs with explicit
`cascade`/`set null`, indexes on every lookup path.

## Usage

```ts
import { getDatabase, users } from "@tael/database";
const db = getDatabase(); // pooled DATABASE_URL (Supabase txn pooler :6543)
const all = await db.select().from(users);
```

## Commands

```bash
pnpm --filter @tael/database db:generate   # generate SQL from schema changes
pnpm --filter @tael/database db:migrate    # apply migrations (uses DIRECT_URL :5432)
pnpm --filter @tael/database db:studio     # browse data in Drizzle Studio
```

## Env

- `DATABASE_URL` — pooled connection (`:6543`), used at runtime.
- `DIRECT_URL` — direct/session connection (`:5432`), used for migrations.

Both live in the repo-root `.env` (gitignored).
