import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Load the monorepo-root .env so server-side vars (DATABASE_URL, ENCRYPTION_KEY,
// AUTH_SECRET, NEXT_PUBLIC_STELLAR_NETWORK) resolve in local dev — Next only reads
// the app's own env files by default. On Vercel the file is absent and dotenv is
// a no-op; Vercel's own environment variables take over.
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const config: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace packages consumed as TypeScript source.
  transpilePackages: [
    "@tael/ui",
    "@tael/auth",
    "@tael/stellar",
    "@tael/types",
    "@tael/database",
    "@tael/claude",
  ],
  // Keep heavy/Node-only deps external so they aren't bundled: the Stellar SDK
  // (dynamic requires), the postgres driver, and the Anthropic SDK (server-only).
  serverExternalPackages: ["@stellar/stellar-sdk", "postgres", "@anthropic-ai/sdk"],
};

export default config;
