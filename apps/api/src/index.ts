import "./load-env"; // must be first — populates process.env for local dev
import { serve } from "@hono/node-server";
import { createContainer } from "./container";
import { env } from "./env";
import { createServer } from "./server";

const container = createContainer(env);
const app = createServer(container);

// Cloud hosts (Railway/Render/Fly) inject the port to bind via `PORT`; fall back
// to API_PORT for local dev. Bind 0.0.0.0 so the platform proxy can reach it.
const port = Number(process.env.PORT) || env.API_PORT;

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`▲ Tael API listening on port ${info.port}`);
});
