import type { Operation } from "../../../types";
import { getOffers, isStellarAddress } from "../horizon";

/** GET /stellar/offers?account=G...&limit=10 — open DEX offers (resting orders) for an account. */
export const operation: Operation = {
  name: "Offers",
  path: "/stellar/offers",
  method: "GET",
  price: "0",
  sampleRequest: "account=<stellar-account-address>&limit=10",
  sampleResponse: `{ "account": "G…", "offers": [{ "id": "12345", "selling": "XLM", "buying": "USDC:G…", "amount": "100", "price": "0.1" }] }`,
  handler: async (c) => {
    const account = c.req.query("account") ?? "";
    if (!isStellarAddress(account)) {
      return c.json({ error: "Provide a valid account Stellar address" }, 400);
    }
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
    try {
      return c.json(await getOffers(account, limit));
    } catch {
      return c.json({ error: "Offers unavailable" }, 502);
    }
  },
};
