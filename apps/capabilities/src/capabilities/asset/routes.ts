import { Hono } from "hono";
import { getAssetInfo, isStellarAddress } from "./horizon";

/**
 * Read-only Stellar Asset lookup. Returns supply, holders count, and flags for an issued asset.
 */
export const routes = new Hono();

// GET /stellar/asset?code=USDC&issuer=G...
routes.get("/stellar/asset", async (c) => {
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
});
