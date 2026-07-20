import type { Operation } from "../../../types";
import { getAssetInfo, isStellarAddress } from "../horizon";

/** GET /stellar/asset?code=USDC&issuer=G... — supply, holders count, and flags for an issued asset. */
export const operation: Operation = {
  name: "Asset",
  path: "/stellar/asset",
  method: "GET",
  price: "0",
  sampleRequest: "code=USDC&issuer=<stellar-account-address>",
  sampleResponse: `{ "code": "USDC", "issuer": "G…", "amount": "1000000", "numAccounts": 42, "flags": { "authRequired": false, "authRevocable": false, "authImmutable": false, "authClawbackEnabled": false } }`,
  handler: async (c) => {
    const code = c.req.query("code") ?? "";
    const issuer = c.req.query("issuer") ?? "";

    if (!code || !isStellarAddress(issuer)) {
      return c.json({ error: "Provide an asset code and valid issuer address" }, 400);
    }

    try {
      return c.json(await getAssetInfo(code, issuer));
    } catch {
      return c.json({ error: "Asset not found" }, 404);
    }
  },
};
