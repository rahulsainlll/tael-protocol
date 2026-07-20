import type { Operation } from "../../../types";
import { getBalances, isStellarAddress } from "../horizon";

/** GET /stellar/balance?address=G... — balances (XLM + assets) for an account. */
export const operation: Operation = {
  name: "Balance",
  path: "/stellar/balance",
  method: "GET",
  price: "0",
  sampleRequest: "address=<stellar-account-address>",
  sampleResponse: `{ "address": "G…", "balances": [{ "asset": "XLM", "issuer": null, "balance": "100.5" }] }`,
  handler: async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address)) {
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    }
    try {
      return c.json({ address, balances: await getBalances(address) });
    } catch {
      return c.json({ error: "Account not found or not funded" }, 404);
    }
  },
};
