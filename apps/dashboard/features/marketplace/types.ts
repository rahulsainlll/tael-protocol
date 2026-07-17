import type { Capability, CapabilityFaq } from "@tael/database";

/**
 * Client-safe view of a capability for the marketplace. Deliberately omits
 * `upstreamUrl` and the encrypted secret — those are private to the publisher
 * and the proxy, and must never reach the browser.
 */
export interface MarketplaceItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  kind: Capability["kind"];
  price: string;
  status: Capability["status"];
  faqs: CapabilityFaq[];
  createdAt: string;
}

export function toMarketplaceItem(capability: Capability): MarketplaceItem {
  return {
    id: capability.id,
    slug: capability.slug,
    name: capability.name,
    description: capability.description,
    logoUrl: capability.logoUrl,
    kind: capability.kind,
    price: capability.price,
    status: capability.status,
    faqs: capability.faqs,
    createdAt: capability.createdAt.toISOString(),
  };
}

export const capabilityKinds = ["api", "mcp", "agent", "model", "dataset", "credit"] as const;
