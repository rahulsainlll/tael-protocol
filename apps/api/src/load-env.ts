import { resolve } from "node:path";

/**
 * Local-dev convenience: load the monorepo-root `.env` into `process.env` before
 * anything reads it, so `DATABASE_URL`, `ENCRYPTION_KEY`, etc. resolve when you
 * run the API standalone. Imported first in `index.ts`.
 *
 * In production/CI the platform injects real env vars and there's no file — the
 * load is wrapped so a missing `.env` is a silent no-op.
 */
try {
  process.loadEnvFile(resolve(process.cwd(), "../../.env"));
} catch {
  // No .env on disk — rely on the real environment.
}
