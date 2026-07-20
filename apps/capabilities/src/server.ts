import { Hono } from "hono";
import { capabilities } from "./registry.generated";

/**
 * The first-party capabilities service. It stays tiny on purpose: every
 * capability lives in its own folder under `src/capabilities/` and is collected
 * into the generated registry, so adding one never touches this file. Each
 * capability's routes are read-only public lookups behind Tael's payment gate,
 * so there are no secrets and no auth here.
 */
export function createServer() {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "tael-capabilities" }));

  for (const { routes } of capabilities) app.route("/", routes);

  return app;
}
