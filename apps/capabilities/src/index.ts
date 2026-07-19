import { serve } from "@hono/node-server";
import { createServer } from "./server";

const app = createServer();

// The platform injects the port to bind via `PORT`; fall back to 3004 locally.
const port = Number(process.env.PORT) || 3004;

serve({ fetch: app.fetch, port, hostname: "0.0.0.0" }, (info) => {
  console.log(`▲ Tael capabilities listening on port ${info.port}`);
});
