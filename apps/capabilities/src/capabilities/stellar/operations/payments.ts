import type { Operation } from "../../../types";
import { getPayments, isStellarAddress } from "../horizon";

/** GET /stellar/payments?address=G...&limit=10 — recent payments in/out of an account. */
export const operation: Operation = {
  name: "Payments",
  path: "/stellar/payments",
  method: "GET",
  price: "0",
  sampleRequest: "address=<stellar-account-address>&limit=10",
  sampleResponse: `{ "address": "G…", "payments": [{ "id": "272206901143048289", "type": "payment", "from": "G…", "to": "G…", "asset": "XLM", "amount": "5", "createdAt": "2026-07-08T02:54:04Z", "transactionHash": "02f5f458d22450be4b4608173a54e25eaf939cc149579bd0a388b5bd7c6ed928" }] }`,
  handler: async (c) => {
    const address = c.req.query("address") ?? "";
    if (!isStellarAddress(address)) {
      return c.json({ error: "Provide a valid Stellar address" }, 400);
    }
    const limit = Math.min(Math.max(Number(c.req.query("limit")) || 10, 1), 50);
    try {
      return c.json(await getPayments(address, limit));
    } catch {
      return c.json({ error: "Account not found or no payments" }, 404);
    }
  },
};
