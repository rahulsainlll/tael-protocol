import type { Operation } from "../../../types";
import { getEffects, isStellarAddress } from "../horizon";

/** GET /stellar/effects?account=G...&limit=10 — recent effects (what changed) for an account. */
export const operation: Operation = {
  name: "Effects",
  path: "/stellar/effects",
  method: "GET",
  price: "0",
  sampleRequest: "account=<stellar-account-address>&limit=10",
  sampleResponse: `{ "account": "G…", "effects": [{ "type": "account_credited", "asset": "XLM", "amount": "5", "createdAt": "2026-…" }] }`,
  handler: async (c) => {
    const account = c.req.query("account") ?? "";
    if (!isStellarAddress(account)) {
      return c.json({ error: "Provide a valid account Stellar address" }, 400);
    }
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
    try {
      return c.json(await getEffects(account, limit));
    } catch {
      return c.json({ error: "Effects unavailable" }, 502);
    }
  },
};
