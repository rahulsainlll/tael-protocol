import { handle } from "hono/vercel";
import { createContainer } from "./container";
import { env } from "./env";
import { createServer } from "./server";

/**
 * Vercel serverless entry. tsup bundles this file (with every @tael/* package
 * inlined) into `dist/vercel.js`, so the Vercel function that imports it only
 * ever sees plain JS with npm deps external. The always-on `index.ts` (used
 * locally and on Node hosts) is a separate entry.
 */
const app = createServer(createContainer(env));

export default handle(app);
