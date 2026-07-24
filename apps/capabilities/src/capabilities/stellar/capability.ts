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
    "Stellar for AI agents: account balances, account details, settled transactions, asset info, network status, DEX orderbook, recent trades, account payments, and recent effects (all free), plus quote (best-price swaps), explain (plain-English transactions), and portfolio (USDC valuation) priced per call, and two on-chain actions the agent runs from its own card: pay (send USDC) and swap (trade one asset for another on the DEX).",
  faqs: [
    {
      question: "Which network does this read from?",
      answer: "The Stellar network Tael is running on (testnet today).",
    },
    {
      question: "Which operations cost money?",
      answer:
        "The chain reads (balance, account, transaction, asset, status, orderbook, trades, payments, effects) are free. Quote, explain, and portfolio are priced per call because they aggregate or interpret data.",
    },
  ],
};
