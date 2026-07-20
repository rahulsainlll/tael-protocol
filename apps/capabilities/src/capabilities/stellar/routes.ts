import { Hono } from "hono";
import { getAccount, getBalances, getTransaction, isStellarAddress } from "./horizon";

/**
 * Read-only Stellar Horizon lookups. All GET, all public, all safe: the payment
 * at Tael's gateway is the only gate, so there are no secrets and no auth here.
 */
export const routes = new Hono();

// GET /stellar/balance?address=G... — balances for an account.
routes.get("/stellar/balance", async (c) => {
  const address = c.req.query("address") ?? "";
  if (!isStellarAddress(address)) return c.json({ error: "Provide a valid Stellar address" }, 400);
  try {
    return c.json({ address, balances: await getBalances(address) });
  } catch {
    return c.json({ error: "Account not found or not funded" }, 404);
  }
});

// GET /stellar/account?address=G... — account details.
routes.get("/stellar/account", async (c) => {
  const address = c.req.query("address") ?? "";
  if (!isStellarAddress(address)) return c.json({ error: "Provide a valid Stellar address" }, 400);
  try {
    return c.json(await getAccount(address));
  } catch {
    return c.json({ error: "Account not found" }, 404);
  }
});

// GET /stellar/tx?hash=... — look up a settled transaction.
routes.get("/stellar/tx", async (c) => {
  const hash = c.req.query("hash") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(hash)) return c.json({ error: "Provide a 64-char tx hash" }, 400);
  try {
    return c.json(await getTransaction(hash));
  } catch {
    return c.json({ error: "Transaction not found" }, 404);
  }
});
