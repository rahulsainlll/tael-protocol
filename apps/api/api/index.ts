// Vercel serverless function entry (root: apps/api). Vercel treats files under
// /api as functions. This one re-exports the tsup-bundled handler from
// dist/vercel.js (plain JS, @tael/* inlined) so Vercel never bundles the raw
// TypeScript workspace packages. vercel.json rewrites every path to here.
export { default } from "../dist/vercel.js";

export const config = { runtime: "nodejs" };
