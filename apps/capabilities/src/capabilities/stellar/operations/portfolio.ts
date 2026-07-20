import type { Operation } from "../../../types";
import { getPortfolio, isStellarAddress } from "../horizon";

/**
 * GET /stellar/portfolio?address=G… — value every asset in an account in USDC,
 * priced across the DEX, with a total. Paid: it aggregates balances and live
 * pricing into one number an agent would otherwise have to assemble itself.
 */
export const operation: Operation = {
  name: "Portfolio",
  path: "/stellar/portfolio",
  method: "GET",
  price: "0.002",
  sampleRequest: "address=<stellar-account-address>",
  sampleResponse: `{ "address": "G…", "holdings": [{ "asset": "USDC", "issuer": "G…", "balance": "10.5", "valueUsdc": "10.5" }, { "asset": "XLM", "issuer": null, "balance": "100", "valueUsdc": "12.3" }], "totalUsdc": "22.8000000" }`,
  handler: async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address)) {
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    }
    try {
      return c.json(await getPortfolio(address));
    } catch {
      return c.json({ error: "Account not found or not funded" }, 404);
    }
  },
};
