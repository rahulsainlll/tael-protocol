import type { Operation } from "../../../types";
import { getClaimableBalances, isStellarAddress } from "../horizon";

/** GET /stellar/claimable?claimant=G...&limit=10 — claimable balances an address is eligible to claim. */
export const operation: Operation = {
  name: "Claimable",
  path: "/stellar/claimable",
  method: "GET",
  price: "0",
  sampleRequest: "claimant=<stellar-account-address>&limit=10",
  sampleResponse: `{ "claimant": "G…", "balances": [{ "id": "0000…", "asset": "XLM", "amount": "5" }] }`,
  handler: async (c) => {
    const claimant = c.req.query("claimant") ?? "";
    if (!isStellarAddress(claimant)) {
      return c.json({ error: "Provide a valid claimant Stellar address" }, 400);
    }
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
    try {
      return c.json(await getClaimableBalances(claimant, limit));
    } catch {
      return c.json({ error: "Claimable balances unavailable" }, 502);
    }
  },
};
