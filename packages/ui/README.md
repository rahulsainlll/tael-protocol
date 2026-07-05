# @tael/ui

Shared React components for Tael frontends, built on **shadcn/ui** conventions (Radix primitives +
Tailwind + CVA). Consumed by `apps/dashboard` today; `apps/web` adopts it incrementally.

## Design

- **Internal package** (Turborepo pattern): ships TS/TSX **source**, not a build. Consumers compile
  it via Next's `transpilePackages: ["@tael/ui"]`.
- **Tokens, not hardcoded colors.** Components use semantic classes (`bg-primary`, `text-muted-
foreground`, …) that the `@tael/config` Tailwind preset maps to CSS variables. Those variables ship
  from `@tael/ui/globals.css` — import it once in an app's root layout.

## Usage

```tsx
import { Button, Card, CardHeader, CardTitle } from "@tael/ui";
```

Consuming app setup:

```ts
// layout.tsx
import "@tael/ui/globals.css";
// tailwind.config.ts → content must include "../../packages/ui/src/**/*.{ts,tsx}"
// next.config.ts     → transpilePackages: ["@tael/ui"]
```

## Boundaries

- **Belongs here:** reusable, presentational components + the `cn()` helper + theme tokens.
- **Never here:** data fetching, business logic, or app-specific composition (those live in the app's
  `features/`).
