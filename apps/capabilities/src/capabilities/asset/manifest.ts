import type { CapabilityModule } from "../../types";

/**
 * The marketplace manifest for the Stellar Asset capability. `endpoint` and `payTo`
 * are injected at publish time (see `publish.ts`), so they are omitted here.
 */
export const manifest: CapabilityModule["manifest"] = {
  name: "Stellar Asset",
  kind: "api",
  description: "Supply, holders, and flags for an issued asset on Stellar. Free.",
  operations: [
    {
      name: "Asset Info",
      path: "/stellar/asset",
      method: "GET",
      price: "0",
      sampleRequest: "code=USDC&issuer=<stellar-account-address>",
      sampleResponse: `{ "code": "USDC", "issuer": "G…", "amount": "1000000", "numAccounts": 42, "flags": { "authRequired": false, "authRevocable": false, "authImmutable": false, "authClawbackEnabled": false } }`,
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
