import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  // When the web app starts importing workspace TS packages (e.g. @tael/ui,
  // @tael/types), add them here so Next compiles their source:
  // transpilePackages: ["@tael/ui", "@tael/types"],
};

export default config;
