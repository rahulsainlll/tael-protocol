import "server-only";
import { and, capabilities, desc, eq, ilike, or, type Capability } from "@tael/database";
import { db } from "../../../lib/db";

/**
 * What the chat agent (and, downstream, the model) is allowed to see about a
 * capability. Deliberately excludes `upstreamUrl`, `upstreamSecretEnc`, and
 * `upstreamAuth` — those are the publisher's private proxy config, never
 * meant to leave the server, let alone go into an LLM prompt.
 */
export interface PublicCapability {
  slug: string;
  name: string;
  description: string;
  kind: string;
  status: string;
  price: string;
  logoUrl: string | null;
  contact: string | null;
  faqs: { question: string; answer: string }[];
  operations: {
    name: string;
    slug?: string;
    method?: string;
    price: string;
    sampleRequest?: string;
    sampleResponse?: string;
  }[];
}

function toPublicShape(row: Capability): PublicCapability {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    status: row.status,
    price: row.price,
    logoUrl: row.logoUrl,
    contact: row.contact,
    faqs: row.faqs ?? [],
    operations: row.spec?.operations ?? [],
  };
}

const SEARCH_LIMIT = 8;

/** Keyword search over public capabilities, by name or description. */
export async function searchCapabilities(query: string): Promise<PublicCapability[]> {
  const like = `%${query.trim()}%`;
  const rows = await db
    .select()
    .from(capabilities)
    .where(
      and(
        eq(capabilities.visibility, "public"),
        or(ilike(capabilities.name, like), ilike(capabilities.description, like)),
      ),
    )
    .orderBy(desc(capabilities.createdAt))
    .limit(SEARCH_LIMIT);
  return rows.map(toPublicShape);
}

/** Full public detail for one capability, by slug. Null if not found/not public. */
export async function getCapabilityBySlug(slug: string): Promise<PublicCapability | null> {
  const rows = await db
    .select()
    .from(capabilities)
    .where(and(eq(capabilities.slug, slug), eq(capabilities.visibility, "public")))
    .limit(1);
  return rows[0] ? toPublicShape(rows[0]) : null;
}
