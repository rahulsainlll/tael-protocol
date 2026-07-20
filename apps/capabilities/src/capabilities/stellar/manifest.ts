import type { CapabilityModule } from "../../types";

/**
 * The marketplace manifest for the Stellar capability. `endpoint` and `payTo`
 * are injected at publish time (see `publish.ts`), so they are omitted here.
 */
export const manifest: CapabilityModule["manifest"] = {
  name: "Stellar",
  kind: "api",
  description:
    "Read-only Stellar lookups for AI agents: account balances, account details, and settled transactions. Free.",
  operations: [
    {
      name: "Balance",
      path: "/stellar/balance",
      method: "GET",
      price: "0",
      sampleRequest: "address=<stellar-account-address>",
      sampleResponse: `{ "address": "G…", "balances": [{ "asset": "XLM", "issuer": null, "balance": "100.5" }] }`,
    },
    {
      name: "Account",
      path: "/stellar/account",
      method: "GET",
      price: "0",
      sampleRequest: "address=<stellar-account-address>",
      sampleResponse: `{ "id": "G…", "sequence": "123", "homeDomain": null, "numTrustlines": 2 }`,
    },
    {
      name: "Transaction",
      path: "/stellar/tx",
      method: "GET",
      price: "0",
      sampleRequest: "hash=<64-hex-transaction-hash>",
      sampleResponse: `{ "hash": "…", "successful": true, "ledger": 1, "operationCount": 1 }`,
    },
  ],
  faqs: [
    {
      question: "Which network does this read from?",
      answer: "The Stellar network Tael is running on (testnet today).",
    },
    { question: "Is it free?", answer: "Yes, every operation is priced at 0." },
  ],
};
