import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // Compile the shared UI package's TypeScript source.
  transpilePackages: ["@tael/ui"],
};

export default config;
