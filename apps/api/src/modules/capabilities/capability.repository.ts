import { and, capabilities, desc, eq, ilike, ne, or, type Database } from "@tael/database";
import { TaelError } from "@tael/types";

/**
 * The subset of a capability the gateway needs to serve and charge for a call.
 * Deliberately narrow — the gateway never needs the publisher, FAQs, or spec.
 */
export interface ServableCapability {
  id: string;
  slug: string;
  name: string;
  /** Headline price per call, decimal USDC string. */
  price: string;
  /** Stellar address that receives settlement. */
  payTo: string;
  /** The developer's real upstream endpoint. */
  upstreamUrl: string;
  /** Encrypted upstream API key (AES-256-GCM), or null if the upstream is open. */
  upstreamSecretEnc: string | null;
}

/** A capability as a buyer discovers it in the public catalog. No secrets. */
export interface CatalogCapability {
  slug: string;
  name: string;
  description: string;
  kind: string;
  /** HTTP method the capability expects, from its spec (e.g. "GET" | "POST"). */
  method: string | null;
  /** Headline price per call, decimal USDC string. */
  price: string;
  logoUrl: string | null;
  /** True when the capability has passed Tael's verify flow (trust badge). */
  verified: boolean;
}

/** Filters for the public catalog. */
export interface CatalogQuery {
  /** Free-text match against name + description. */
  q?: string;
  /** Restrict to one kind (api | mcp | agent | model | dataset). */
  kind?: string;
  /** Page size (default 50, max 100). */
  limit?: number;
}

/** Port: read capabilities that are eligible to be called through the gateway. */
export interface CapabilityRepository {
  /**
   * Find a capability that may be served over the public gateway: it must exist,
   * be `verified`, and not be `private`. Returns null otherwise.
   */
  findServableBySlug(slug: string): Promise<ServableCapability | null>;

  /**
   * List public, verified capabilities for the discovery catalog, newest first.
   * Never returns secrets or the upstream URL — only what a buyer needs to pick
   * and call one.
   */
  listCatalog(query?: CatalogQuery): Promise<CatalogCapability[]>;
}

/** Postgres-backed adapter over @tael/database. */
export class DbCapabilityRepository implements CapabilityRepository {
  constructor(private readonly db: Database | undefined) {}

  async findServableBySlug(slug: string): Promise<ServableCapability | null> {
    if (!this.db) {
      throw new TaelError(
        "INTERNAL",
        "DATABASE_URL is not configured — the gateway cannot read capabilities.",
      );
    }

    const [row] = await this.db
      .select({
        id: capabilities.id,
        slug: capabilities.slug,
        name: capabilities.name,
        price: capabilities.price,
        payTo: capabilities.payTo,
        upstreamUrl: capabilities.upstreamUrl,
        upstreamSecretEnc: capabilities.upstreamSecretEnc,
      })
      .from(capabilities)
      .where(
        and(
          eq(capabilities.slug, slug),
          eq(capabilities.status, "verified"),
          ne(capabilities.visibility, "private"),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  async listCatalog(query: CatalogQuery = {}): Promise<CatalogCapability[]> {
    if (!this.db) {
      throw new TaelError(
        "INTERNAL",
        "DATABASE_URL is not configured — the gateway cannot read capabilities.",
      );
    }

    const limit = Math.min(Math.max(query.limit ?? 50, 1), 100);
    const filters = [eq(capabilities.status, "verified"), eq(capabilities.visibility, "public")];
    if (query.kind)
      filters.push(
        eq(capabilities.kind, query.kind as (typeof capabilities.kind.enumValues)[number]),
      );
    if (query.q) {
      const like = `%${query.q}%`;
      const match = or(ilike(capabilities.name, like), ilike(capabilities.description, like));
      if (match) filters.push(match);
    }

    const rows = await this.db
      .select({
        slug: capabilities.slug,
        name: capabilities.name,
        description: capabilities.description,
        kind: capabilities.kind,
        spec: capabilities.spec,
        price: capabilities.price,
        logoUrl: capabilities.logoUrl,
        status: capabilities.status,
      })
      .from(capabilities)
      .where(and(...filters))
      .orderBy(desc(capabilities.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      kind: r.kind,
      method: (r.spec as { method?: string } | null)?.method ?? null,
      price: r.price,
      logoUrl: r.logoUrl,
      verified: r.status === "verified",
    }));
  }
}
