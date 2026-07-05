import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // The Stellar SDK is heavy and native-ish; always keep it external.
  external: ["@stellar/stellar-sdk"],
});
