import type { Operation } from "../../../types";
import { explainTransaction } from "../horizon";

/**
 * GET /stellar/explain?hash=… — decode a settled transaction into a plain-English
 * summary of what it did (payments, swaps, trustlines, offers…). Paid: it turns a
 * raw ledger entry into something an agent can reason about, which is interpretation
 * on top of Horizon, not a mirror of it.
 */
export const operation: Operation = {
  name: "Explain",
  path: "/stellar/explain",
  method: "GET",
  price: "0.001",
  sampleRequest: "hash=<64-hex-transaction-hash>",
  sampleResponse: `{ "hash": "…", "successful": true, "summary": "Transaction succeeded with 1 operation: GABC…WXYZ paid 5 XLM to GDEF…7890.", "operations": [{ "type": "payment", "summary": "GABC…WXYZ paid 5 XLM to GDEF…7890" }] }`,
  handler: async (c) => {
    const hash = c.req.query("hash") ?? "";
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return c.json({ error: "Provide a 64-char tx hash" }, 400);
    }
    try {
      return c.json(await explainTransaction(hash));
    } catch {
      return c.json({ error: "Transaction not found" }, 404);
    }
  },
};
