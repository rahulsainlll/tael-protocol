import { Hono } from "hono";
import { getStatus } from "./horizon";

/** Read-only Stellar network status. No params, no secrets. */
export const routes = new Hono();

// GET /stellar/status — latest ledger + network parameters.
routes.get("/stellar/status", async (c) => {
  try {
    return c.json(await getStatus());
  } catch {
    return c.json({ error: "Stellar network status unavailable" }, 502);
  }
});
