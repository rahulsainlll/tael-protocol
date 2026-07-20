import type { CapabilityMeta } from "../../types";

/** The FX Rates capability's metadata. A self-contained, non-Stellar utility. */
export const meta: CapabilityMeta = {
  name: "FX Rates",
  kind: "api",
  description:
    "Reference fiat exchange rates for a base currency (USD, EUR, NGN, …). A self-contained, non-Stellar utility. Free.",
  faqs: [
    {
      question: "Which currencies are supported?",
      answer:
        "Any 3-letter currency code as the base; the response lists rates to every other currency.",
    },
    { question: "Is it free?", answer: "Yes, priced at 0." },
  ],
};
