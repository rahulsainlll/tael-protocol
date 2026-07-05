import type { Config } from "tailwindcss";
import preset from "@tael/config/tailwind";

const config: Config = {
  presets: [preset],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
};

export default config;
