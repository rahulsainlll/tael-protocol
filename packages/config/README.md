# @tael/config

Single source of truth for build, lint, format and styling configuration across the monorepo.
Nothing here is application code — it only ships presets.

## Exports

| Import                               | What it is                                       |
| ------------------------------------ | ------------------------------------------------ |
| `@tael/config/tsconfig/base.json`    | Strict base TS config (all packages extend this) |
| `@tael/config/tsconfig/library.json` | For publishable Node libraries (`packages/*`)    |
| `@tael/config/tsconfig/nextjs.json`  | For Next.js apps (`apps/web`)                    |
| `@tael/config/eslint`                | Shared flat ESLint config                        |
| `@tael/config/prettier`              | Shared Prettier config                           |
| `@tael/config/tailwind`              | Shared Tailwind preset                           |

## Rules

- **Belongs here:** cross-cutting tooling config that must be identical everywhere.
- **Never here:** runtime code, business logic, or config used by a single workspace only
  (keep that local to the workspace).
