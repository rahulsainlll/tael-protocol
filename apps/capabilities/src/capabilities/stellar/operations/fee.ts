import type { Operation } from "../../../types";
import { getFeeStats } from "../horizon";

/** GET /stellar/fee — recommended base fee stats for the next ledger. No params. */
export const operation: Operation = {
  name: "Fee",
  path: "/stellar/fee",
  method: "GET",
  price: "0",
  sampleRequest: "",
  sampleResponse: `{ "lastLedgerBaseFee": "100", "min": "100", "mode": "100", "p50": "100", "p90": "200" }`,
  handler: async (c) => {
    try {
      return c.json(await getFeeStats());
    } catch {
      return c.json({ error: "Stellar fee stats unavailable" }, 502);
    }
  },
};
