import { index, jsonb, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import {
  capabilityKind,
  capabilityStatus,
  capabilityVisibility,
  primaryId,
  timestamps,
} from "./_shared";
import { users } from "./users";

/** A publisher-answered FAQ entry shown publicly on the listing. */
export interface CapabilityFaq {
  question: string;
  answer: string;
}

/**
 * One callable operation of a capability (e.g. an API endpoint / MCP tool),
 * with its own sample request/response and its own price per call. A capability
 * can expose several.
 */
export interface CapabilityOperation {
  /** Human label, e.g. "Extract text" or "GET /prices". */
  name: string;
  /**
   * URL-safe handle for addressing this operation at `/c/<slug>/<op>`. When
   * absent, it's derived from `name`. Lets one capability expose many priced
   * operations (e.g. a Nebula MCP with balance / quote / swap / pay).
   */
  slug?: string;
  /**
   * Optional path appended to the capability's `upstreamUrl` for this operation,
   * e.g. "/v1/swap". Empty means the base URL (the operation is selected by the
   * request body, as with an MCP tool call).
   */
  path?: string;
  /** HTTP method for API/model kinds, e.g. "GET" | "POST". */
  method?: string;
  /** Example request payload (JSON string), shown publicly. */
  sampleRequest?: string;
  /** Example response payload (JSON string), shown publicly. */
  sampleResponse?: string;
  /** Price per call for THIS operation, USDC decimal string. */
  price: string;
}

/** Kind-aware contract for a capability — the list of callable operations. */
export interface CapabilitySpec {
  operations?: CapabilityOperation[];
}

export interface UpstreamAuth {
  /** How to send the stored secret. */
  scheme: "bearer" | "header" | "none";
  /** Header name when scheme = "header", e.g. "x-api-key". */
  header?: string;
  /** Static headers always sent to the upstream, e.g. { "anthropic-version": "2023-06-01" }. */
  extraHeaders?: Record<string, string>;
}

/**
 * Usage-based (metered) billing config for a capability — used by model
 * capabilities (Claude, etc.) that charge per token rather than a flat price.
 * Null/absent = flat per-call pricing (every existing capability).
 */
export interface CapabilityBilling {
  /** Bill by token usage (call-then-charge) instead of a flat per-call price. */
  metered: boolean;
  /** Model key the gateway bills at, e.g. "claude-haiku-4-5" (rate lookup). */
  model?: string;
  /** Max output tokens the gateway enforces, to bound the worst-case cost. */
  maxTokens?: number;
}

/**
 * A published capability: a developer wraps an upstream service (API/MCP/agent)
 * and sells it per call. This is the core reason Tael needs a database — the
 * `upstreamUrl` and `upstreamSecretEnc` (the developer's real API key) are
 * private and mutable, so they cannot live on-chain.
 *
 * `upstreamSecretEnc` is stored ENCRYPTED (see @tael/database crypto helper);
 * never persist a raw upstream key.
 */
export const capabilities = pgTable(
  "capabilities",
  {
    id: primaryId(),
    /** URL-safe unique handle → taelprotocol.xyz/<slug>. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    /** Optional product logo URL, shown on cards + the listing (public). */
    logoUrl: text("logo_url"),
    /** Optional public support/contact (email, URL, Discord, or @handle). */
    contact: text("contact"),
    kind: capabilityKind("kind").notNull(),
    visibility: capabilityVisibility("visibility").notNull().default("public"),
    status: capabilityStatus("status").notNull().default("draft"),

    /** AI-generated questions the publisher answered at publish time (public). */
    faqs: jsonb("faqs").$type<CapabilityFaq[]>().notNull().default([]),
    /** Kind-aware contract: method + sample request/response (public). */
    spec: jsonb("spec").$type<CapabilitySpec>().notNull().default({}),

    /** Price per successful call, USDC decimal string. */
    price: numeric("price", { precision: 20, scale: 7 }).notNull(),
    /** Stellar address that receives settlement for this capability. */
    payTo: text("pay_to").notNull(),

    /** The real upstream endpoint Tael proxies to (private). */
    upstreamUrl: text("upstream_url").notNull(),
    /** Encrypted upstream credential (e.g. the dev's Anthropic key). Never raw. */
    upstreamSecretEnc: text("upstream_secret_enc"),
    /** Upstream authentication scheme configuration. Nullable (defaults to Bearer). */
    upstreamAuth: jsonb("upstream_auth").$type<UpstreamAuth>(),
    /** Metered (token-based) billing config. Nullable = flat per-call pricing. */
    billing: jsonb("billing").$type<CapabilityBilling>(),

    publisherId: uuid("publisher_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("capabilities_publisher_id_idx").on(table.publisherId),
    index("capabilities_kind_idx").on(table.kind),
    index("capabilities_visibility_idx").on(table.visibility),
  ],
);

export type Capability = typeof capabilities.$inferSelect;
export type NewCapability = typeof capabilities.$inferInsert;
