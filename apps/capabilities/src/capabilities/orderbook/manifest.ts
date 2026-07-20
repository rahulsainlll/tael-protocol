import type { CapabilityModule } from "../../types";

/** Marketplace manifest for the Stellar DEX orderbook capability. */
export const manifest: CapabilityModule["manifest"] = {
  name: "Stellar Orderbook",
  kind: "api",
  description:
    "A Stellar DEX orderbook snapshot: top bids and asks for a trading pair. Assets as `native` or `CODE:ISSUER`. Free.",
  operations: [
    {
      name: "Orderbook",
      path: "/stellar/orderbook",
      method: "GET",
      price: "0",
      sampleRequest: "selling=native&buying=USDC:<issuer-address>&limit=10",
      sampleResponse: `{ "selling": "native", "buying": "USDC:G…", "bids": [{ "price": "0.1", "amount": "100" }], "asks": [{ "price": "0.11", "amount": "50" }] }`,
    },
  ],
  faqs: [
    {
      question: "How do I specify an asset?",
      answer: "Use `native` for XLM, or `CODE:ISSUER` (e.g. `USDC:G…`) for an issued asset.",
    },
    { question: "Is it free?", answer: "Yes, priced at 0." },
  ],
};
