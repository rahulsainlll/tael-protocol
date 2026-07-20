import type { CapabilityMeta } from "../../types";

/**
 * The Stellar capability's metadata. Its operations live one-per-file under
 * ./operations/ and are collected automatically, so adding a Stellar operation
 * never touches this file.
 */
export const meta: CapabilityMeta = {
  name: "Stellar",
  kind: "api",
  description:
    "Read-only Stellar lookups for AI agents: account balances, account details, settled transactions, network status, and DEX orderbook. Free.",
  faqs: [
    {
      question: "Which network does this read from?",
      answer: "The Stellar network Tael is running on (testnet today).",
    },
    { question: "Is it free?", answer: "Yes, every operation is priced at 0." },
  ],
};
