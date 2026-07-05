import type { Config } from "tailwindcss";
import preset from "@tael/config/tailwind";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    // Scan the shared UI source so its classes aren't purged.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
