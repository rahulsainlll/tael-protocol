import type { Operation } from "../../../types";
import { getStatus } from "../horizon";

/** GET /stellar/status — latest ledger + network parameters. No params. */
export const operation: Operation = {
  name: "Status",
  path: "/stellar/status",
  method: "GET",
  price: "0",
  sampleRequest: "",
  sampleResponse: `{ "latestLedger": 123456, "protocolVersion": 21, "baseFee": "100", "baseReserve": "5000000", "closedAt": "2026-…", "hash": "…" }`,
  handler: async (c) => {
    try {
      return c.json(await getStatus());
    } catch {
      return c.json({ error: "Stellar network status unavailable" }, 502);
    }
  },
};
