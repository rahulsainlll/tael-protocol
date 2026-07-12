import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { users } from "./users";

/**
 * Programmatic access tokens for a user's agents/services. Only a hash of the
 * key is stored (never the raw key); `prefix` is shown in the UI for identification.
 */
export const apiKeys = pgTable(
  "api_keys",
  {
    id: primaryId(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Default"),
    /** First few chars of the key, e.g. "tael_live_abcd", shown in the dashboard. */
    prefix: text("prefix").notNull(),
    /** SHA-256 hash of the full key. The raw key is shown once, at creation. */
    keyHash: text("key_hash").notNull().unique(),
    /** Last time this key authenticated a request. */
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    /** Set when revoked; a non-null value disables the key. */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("api_keys_owner_id_idx").on(table.ownerId),
    index("api_keys_key_hash_idx").on(table.keyHash),
  ],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
