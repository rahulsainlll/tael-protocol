import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Compile the workspace packages consumed as TypeScript source.
  transpilePackages: ["@tael/ui", "@tael/auth", "@tael/stellar", "@tael/types"],
  // Keep the heavy Stellar SDK external (it has dynamic requires that don't bundle
  // cleanly). It's only used in the /api/auth/verify route (Node runtime).
  serverExternalPackages: ["@stellar/stellar-sdk"],
};

export default config;
