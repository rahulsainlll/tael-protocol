import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  // Inline the workspace types into the .d.ts too, so consumers never resolve
  // `@tael/*` (which they don't install).
  dts: { resolve: true },
  clean: true,
  sourcemap: true,
  treeshake: true,
  // Inline the workspace packages so the published SDK is self-contained — users
  // install one package. `zod` stays external (a normal runtime dependency).
  noExternal: [/^@tael\//],
});
