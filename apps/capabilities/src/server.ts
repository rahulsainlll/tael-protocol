import { Hono } from "hono";
import { getAccount, getBalances, getTransaction, isStellarAddress } from "./stellar";

/**
 * The first-party capabilities service. Each route here is published to the Tael
 * marketplace as an operation of the `stellar` capability. Everything is a
 * read-only, public Stellar lookup, so there are no secrets and no auth: the
 * payment at Tael's gateway is the only gate.
 */
export function createServer() {
  const app = new Hono();

  app.get("/health", (c) => c.json({ status: "ok", service: "tael-capabilities" }));

  // GET /stellar/balance?address=G... — balances for an account.
  app.get("/stellar/balance", async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address))
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    try {
      return c.json({ address, balances: await getBalances(address) });
    } catch {
      return c.json({ error: "Account not found or not funded" }, 404);
    }
  });

  // GET /stellar/account?address=G... — account details.
  app.get("/stellar/account", async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address))
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    try {
      return c.json(await getAccount(address));
    } catch {
      return c.json({ error: "Account not found" }, 404);
    }
  });

  // GET /stellar/tx?hash=... — look up a settled transaction.
  app.get("/stellar/tx", async (c) => {
    const hash = c.req.query("hash") ?? "";
    if (!/^[a-f0-9]{64}$/i.test(hash)) return c.json({ error: "Provide a 64-char tx hash" }, 400);
    try {
      return c.json(await getTransaction(hash));
    } catch {
      return c.json({ error: "Transaction not found" }, 404);
    }
  });

  return app;
}
