import { and, capabilities, eq, ne, type Database } from "@tael/database";
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

/** Port: read capabilities that are eligible to be called through the gateway. */
export interface CapabilityRepository {
  /**
   * Find a capability that may be served over the public gateway: it must exist,
   * be `verified`, and not be `private`. Returns null otherwise.
   */
  findServableBySlug(slug: string): Promise<ServableCapability | null>;
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
}
