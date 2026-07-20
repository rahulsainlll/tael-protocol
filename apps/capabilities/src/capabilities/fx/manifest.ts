import type { CapabilityModule } from "../../types";

/** Marketplace manifest for the FX rates capability. */
export const manifest: CapabilityModule["manifest"] = {
  name: "FX Rates",
  kind: "api",
  description:
    "Reference fiat exchange rates for a base currency (USD, EUR, NGN, …). A self-contained, non-Stellar utility. Free.",
  operations: [
    {
      name: "Rates",
      path: "/fx/rates",
      method: "GET",
      price: "0",
      sampleRequest: "base=USD",
      sampleResponse: `{ "base": "USD", "rates": { "EUR": 0.92, "NGN": 1600 }, "asOf": "Mon, 20 Jul 2026 00:00:00 +0000" }`,
    },
  ],
  faqs: [
    {
      question: "Which currencies are supported?",
      answer:
        "Any 3-letter currency code as the base; the response lists rates to every other currency.",
    },
    { question: "Is it free?", answer: "Yes, priced at 0." },
  ],
};
