import type { Operation } from "../../../types";
import { getQuote } from "../horizon";

/**
 * GET /stellar/quote?source=USDC:G…&dest=native&amount=100 — best price to send
 * exactly `amount` of `source` and receive `dest`, across the Stellar DEX + pools.
 * Paid: aggregating every book and pool into one best-route answer is real work
 * an agent won't do itself.
 */
export const operation: Operation = {
  name: "Quote",
  path: "/stellar/quote",
  method: "GET",
  price: "0.001",
  sampleRequest: "source=USDC:<issuer-address>&dest=native&amount=100",
  sampleResponse: `{ "source": "USDC:G…", "sourceAmount": "100", "dest": "native", "destAmount": "812.44", "path": [] }`,
  handler: async (c) => {
    const source = c.req.query("source") ?? "";
    const dest = c.req.query("dest") ?? "";
    const amount = c.req.query("amount") ?? "";
    if (!source || !dest || !(Number(amount) > 0)) {
      return c.json(
        { error: "Provide source, dest (native or CODE:ISSUER) and a positive amount" },
        400,
      );
    }
    try {
      return c.json(await getQuote(source, dest, amount));
    } catch (err) {
      if (err instanceof Error && err.message === "bad asset") {
        return c.json({ error: "Assets must be `native` or `CODE:ISSUER`" }, 400);
      }
      if (err instanceof Error && err.message === "no path") {
        return c.json({ error: "No route found for this pair and amount" }, 404);
      }
      return c.json({ error: "Quote unavailable" }, 502);
    }
  },
};
