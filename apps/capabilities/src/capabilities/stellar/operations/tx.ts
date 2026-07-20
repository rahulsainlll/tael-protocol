import type { Operation } from "../../../types";
import { getTransaction } from "../horizon";

/** GET /stellar/tx?hash=... — look up a settled transaction by its hash. */
export const operation: Operation = {
  name: "Transaction",
  path: "/stellar/tx",
  method: "GET",
  price: "0",
  sampleRequest: "hash=<64-hex-transaction-hash>",
  sampleResponse: `{ "hash": "…", "successful": true, "ledger": 1, "operationCount": 1 }`,
  handler: async (c) => {
    const hash = c.req.query("hash") ?? "";
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return c.json({ error: "Provide a 64-char tx hash" }, 400);
    }
    try {
      return c.json(await getTransaction(hash));
    } catch {
      return c.json({ error: "Transaction not found" }, 404);
    }
  },
};
