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
    "Stellar lookups for AI agents: account balances, account details, settled transactions, asset info, network status, DEX orderbook, recent trades, and account payments (all free), plus quote (best-price swaps), explain (plain-English transactions), and portfolio (USDC valuation) — priced per call.",
  faqs: [
    {
      question: "Which network does this read from?",
      answer: "The Stellar network Tael is running on (testnet today).",
    },
    {
      question: "Which operations cost money?",
      answer:
        "The chain reads (balance, account, transaction, asset, status, orderbook, trades, payments) are free. Quote, explain, and portfolio are priced per call because they aggregate or interpret data.",
    },
  ],
};
