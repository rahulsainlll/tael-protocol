import "./load-env"; // must be first — populates process.env for local dev
import { serve } from "@hono/node-server";
import { createContainer } from "./container";
import { env } from "./env";
import { createServer } from "./server";

const container = createContainer(env);
const app = createServer(container);

serve({ fetch: app.fetch, port: env.API_PORT }, (info) => {
  console.log(`▲ Tael API listening on http://localhost:${info.port}`);
});
