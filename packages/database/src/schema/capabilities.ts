import { index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { capabilityKind, capabilityVisibility, primaryId, timestamps } from "./_shared";
import { users } from "./users";

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
    kind: capabilityKind("kind").notNull(),
    visibility: capabilityVisibility("visibility").notNull().default("public"),

    /** Price per successful call, USDC decimal string. */
    price: numeric("price", { precision: 20, scale: 7 }).notNull(),
    /** Stellar address that receives settlement for this capability. */
    payTo: text("pay_to").notNull(),

    /** The real upstream endpoint Tael proxies to (private). */
    upstreamUrl: text("upstream_url").notNull(),
    /** Encrypted upstream credential (e.g. the dev's Anthropic key). Never raw. */
    upstreamSecretEnc: text("upstream_secret_enc"),

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
