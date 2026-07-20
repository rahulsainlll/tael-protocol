import { Hono } from "hono";
import { getOrderbook } from "./horizon";

/** Read-only Stellar DEX orderbook. No secrets. */
export const routes = new Hono();

// GET /stellar/orderbook?selling=native&buying=USDC:G...&limit=10
routes.get("/stellar/orderbook", async (c) => {
  const selling = c.req.query("selling") ?? "";
  const buying = c.req.query("buying") ?? "";
  if (!selling || !buying) {
    return c.json({ error: "Provide selling and buying (native or CODE:ISSUER)" }, 400);
  }
  const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
  try {
    return c.json(await getOrderbook(selling, buying, limit));
  } catch (err) {
    if (err instanceof Error && err.message === "bad asset") {
      return c.json({ error: "Assets must be `native` or `CODE:ISSUER`" }, 400);
    }
    return c.json({ error: "Orderbook unavailable" }, 502);
  }
});
