import type { Operation } from "../../../types";
import { isStellarAddress } from "../horizon";
import { buildPayIntent } from "../pay";

/**
 * GET /stellar/pay?to=G…&amount=1.5 — an ACTION. It returns an intent for the
 * caller's Tael Card to sign and submit (send USDC to `to`), not data. Free to
 * call; the money moves when the Card signs. The response is safe to fetch — it
 * only validates and describes the payment, it never signs or submits.
 */
export const operation: Operation = {
  name: "Pay",
  path: "/stellar/pay",
  method: "GET",
  price: "0",
  sampleRequest: "to=<stellar-account-address>&amount=1.5",
  sampleResponse: `{ "tael_action": "pay", "asset": "USDC", "to": "G…", "amount": "1.5", "summary": "Pay 1.5 USDC to G…" }`,
  handler: async (c) => {
    const to = c.req.query("to") ?? "";
    const amount = c.req.query("amount") ?? "";
    const memo = c.req.query("memo") || undefined;
    if (!isStellarAddress(to)) {
      return c.json({ error: "Provide a valid destination address" }, 400);
    }
    if (!(Number(amount) > 0)) {
      return c.json({ error: "Provide a positive amount" }, 400);
    }
    if (memo && memo.length > 28) {
      return c.json({ error: "Memo must be at most 28 characters" }, 400);
    }
    try {
      return c.json(await buildPayIntent(to, amount, memo));
    } catch (err) {
      return c.json(
        { error: err instanceof Error ? err.message : "Could not prepare the payment" },
        422,
      );
    }
  },
};
