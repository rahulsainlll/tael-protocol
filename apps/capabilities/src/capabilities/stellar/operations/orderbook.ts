import type { Operation } from "../../../types";
import { getOrderbook } from "../horizon";

/** GET /stellar/orderbook?selling=native&buying=USDC:G...&limit=10 — DEX orderbook. */
export const operation: Operation = {
  name: "Orderbook",
  path: "/stellar/orderbook",
  method: "GET",
  price: "0",
  sampleRequest: "selling=native&buying=USDC:<issuer-address>&limit=10",
  sampleResponse: `{ "selling": "native", "buying": "USDC:G…", "bids": [{ "price": "0.1", "amount": "100" }], "asks": [{ "price": "0.11", "amount": "50" }] }`,
  handler: async (c) => {
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
  },
};
