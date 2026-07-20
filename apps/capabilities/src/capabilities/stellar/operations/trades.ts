import type { Operation } from "../../../types";
import { getTrades } from "../horizon";

/** GET /stellar/trades?base=native&counter=USDC:G...&limit=10 — recent executed trades for a pair. */
export const operation: Operation = {
  name: "Trades",
  path: "/stellar/trades",
  method: "GET",
  price: "0",
  sampleRequest: "base=native&counter=USDC:<issuer-address>&limit=10",
  sampleResponse: `{ "base": "native", "counter": "USDC:G…", "trades": [{ "id": "272631505904648199-0", "ledgerCloseTime": "2026-07-14T18:51:25Z", "baseAmount": "10.0000000", "counterAmount": "1.2000000", "baseIsSeller": false, "price": { "n": "12", "d": "100" } }] }`,
  handler: async (c) => {
    const base = c.req.query("base") ?? "";
    const counter = c.req.query("counter") ?? "";
    if (!base || !counter) {
      return c.json({ error: "Provide base and counter (native or CODE:ISSUER)" }, 400);
    }
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
    try {
      return c.json(await getTrades(base, counter, limit));
    } catch (err) {
      if (err instanceof Error && err.message === "bad asset") {
        return c.json({ error: "Assets must be `native` or `CODE:ISSUER`" }, 400);
      }
      return c.json({ error: "Trades unavailable" }, 502);
    }
  },
};
