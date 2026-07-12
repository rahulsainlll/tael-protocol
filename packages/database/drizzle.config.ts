import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load env from the repo root .env so DATABASE_URL / DIRECT_URL are available.
config({ path: "../../.env" });

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    // Migrations run over the direct/session connection (not the txn pooler).
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
