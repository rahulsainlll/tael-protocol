import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Load the monorepo-root .env so server-side vars (AUTH_SECRET, COOKIE_DOMAIN,
// NEXT_PUBLIC_API_URL, ...) resolve in local dev — Next only reads the app's
// own env files by default. On Vercel the file is absent and dotenv is a
// no-op; Vercel's own environment variables take over.
loadEnv({ path: resolve(process.cwd(), "../../.env") });

const config: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace packages consumed as TypeScript source.
  transpilePackages: ["@tael/ui", "@tael/auth", "@tael/stellar", "@tael/database", "@tael/claude"],
  serverExternalPackages: ["@stellar/stellar-sdk", "postgres", "@anthropic-ai/sdk"],
};

export default config;
