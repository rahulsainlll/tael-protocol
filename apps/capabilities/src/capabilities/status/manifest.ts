import type { CapabilityModule } from "../../types";

/** Marketplace manifest for the Stellar network status capability. */
export const manifest: CapabilityModule["manifest"] = {
  name: "Stellar Status",
  kind: "api",
  description:
    "The Stellar network's current state: latest ledger, protocol version, base fee and base reserve. Free.",
  operations: [
    {
      name: "Status",
      path: "/stellar/status",
      method: "GET",
      price: "0",
      sampleRequest: "",
      sampleResponse: `{ "latestLedger": 123456, "protocolVersion": 21, "baseFee": "100", "baseReserve": "5000000", "closedAt": "2026-…", "hash": "…" }`,
    },
  ],
  faqs: [
    {
      question: "Which network does this read from?",
      answer: "The Stellar network Tael is running on (testnet today).",
    },
    { question: "Is it free?", answer: "Yes, priced at 0." },
  ],
};
