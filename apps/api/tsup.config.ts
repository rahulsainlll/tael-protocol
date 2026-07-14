import { defineConfig } from "tsup";

export default defineConfig({
  // index.ts = always-on Node server (local / Render); vercel.ts = serverless
  // handler for Vercel functions. Both bundle @tael/* inline.
  entry: ["src/index.ts", "src/vercel.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  dts: false,
  // Inline the @tael/* source into a self-contained bundle; leave npm deps external.
  noExternal: [/^@tael\//],
});
