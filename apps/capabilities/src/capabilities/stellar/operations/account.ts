import type { Operation } from "../../../types";
import { getAccount, isStellarAddress } from "../horizon";

/** GET /stellar/account?address=G... — account details. */
export const operation: Operation = {
  name: "Account",
  path: "/stellar/account",
  method: "GET",
  price: "0",
  sampleRequest: "address=<stellar-account-address>",
  sampleResponse: `{ "id": "G…", "sequence": "123", "homeDomain": null, "numTrustlines": 2 }`,
  handler: async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address)) {
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    }
    try {
      return c.json(await getAccount(address));
    } catch {
      return c.json({ error: "Account not found" }, 404);
    }
  },
};
