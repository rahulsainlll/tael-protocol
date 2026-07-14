import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  dts: false,
  // Inline the @tael/* source into a self-contained bundle; leave npm deps external.
  noExternal: [/^@tael\//],
});
