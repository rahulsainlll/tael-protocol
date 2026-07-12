import type { Capability } from "@tael/database";

/** Serializable row for the "My Capabilities" table (safe to pass to a client component). */
export interface CapabilityListItem {
  id: string;
  slug: string;
  name: string;
  kind: Capability["kind"];
  status: Capability["status"];
  visibility: Capability["visibility"];
  price: string;
  faqCount: number;
  createdAt: string;
}

export function toListItem(capability: Capability): CapabilityListItem {
  return {
    id: capability.id,
    slug: capability.slug,
    name: capability.name,
    kind: capability.kind,
    status: capability.status,
    visibility: capability.visibility,
    price: capability.price,
    faqCount: capability.faqs.length,
    createdAt: capability.createdAt.toISOString(),
  };
}
