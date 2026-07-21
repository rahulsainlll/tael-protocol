import type { Config } from "tailwindcss";
import { heroui } from "@heroui/react";
import preset from "@tael/config/tailwind";

const config: Config = {
  presets: [preset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // HeroUI's compiled theme (only the /capabilities page uses it).
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Marketing light theme (matches Figma "New app" hero).
        ink: {
          DEFAULT: "#27272A", // headings
          soft: "#4F4F55", // body copy
          muted: "#606169", // labels / captions
          nav: "#20242A", // nav links
        },
        surface: "#F2F2F3", // page background below the nav
        line: "#E6E6E8", // hairline borders / guide rails
        accent: "#156DFC", // brand blue
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "cursive"],
        pixel: ["var(--font-pixel)", "ui-monospace", "monospace"],
        serif: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [heroui()],
};

export default config;
