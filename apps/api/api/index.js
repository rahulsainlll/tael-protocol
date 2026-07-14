// Vercel serverless function entry (root: apps/api). Deliberately plain JS so
// Vercel's @vercel/node builder does NOT run tsc over it (which fails on the Web
// Request/Response globals in our monorepo). It re-exports the tsup-bundled
// handler from dist/vercel.js (plain JS, every @tael/* inlined). vercel.json
// rewrites every path here and builds dist/ first.
export { default } from "../dist/vercel.js";
