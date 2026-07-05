# web

The Tael marketing website — Next.js 15 (App Router) + Tailwind.

## Notes

- Tailwind extends the shared preset from `@tael/config/tailwind`, so tokens stay consistent with
  every other Tael surface.
- Shared UI is intentionally **not** a package yet. When a second frontend (the dashboard) appears
  and needs the same components, extract `@tael/ui` then — not before.

## Run

```bash
pnpm --filter web dev     # http://localhost:3000
```
