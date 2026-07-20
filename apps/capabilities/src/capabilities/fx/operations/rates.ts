import type { Operation } from "../../../types";
import { getRates } from "../rates";

/** GET /fx/rates?base=USD — reference rates for a base currency (defaults to USD). */
export const operation: Operation = {
  name: "Rates",
  path: "/fx/rates",
  method: "GET",
  price: "0",
  sampleRequest: "base=USD",
  sampleResponse: `{ "base": "USD", "rates": { "EUR": 0.92, "NGN": 1600 }, "asOf": "Mon, 20 Jul 2026 00:00:00 +0000" }`,
  handler: async (c) => {
    const base = (c.req.query("base") ?? "USD").toUpperCase();
    if (!/^[A-Z]{3}$/.test(base)) {
      return c.json({ error: "Provide a 3-letter currency code (e.g. USD)" }, 400);
    }
    try {
      return c.json(await getRates(base));
    } catch {
      return c.json({ error: "FX rates unavailable" }, 502);
    }
  },
};
