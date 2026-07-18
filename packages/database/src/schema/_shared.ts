import { sql } from "drizzle-orm";
import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Shared column builders and enums so every table is consistent:
 * UUID primary keys, timestamptz audit columns, and native Postgres enums.
 */

/** UUID primary key, generated in the database. */
export const primaryId = () => uuid("id").primaryKey().defaultRandom();

/** `created_at` / `updated_at`, always timezone-aware. Spread into each table. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
};

// --- Native enums (created as real Postgres types, not text) ---

/**
 * Kinds of purchasable capability. Mirrors @tael/types capabilityKind.
 *
 * "credit" is TrustLine's addition: unlike every other kind, its upstream is
 * NOT a third-party service Tael proxies to — it's TrustLine's own read-only
 * underwriting API (GET .../agent/:address/available-credit). It fits the
 * existing per-call-price gateway model unmodified (a genuine, cheap, metered
 * HTTP call), so no gateway changes were needed to add it — see
 * TRUSTLINE_INTEGRATION.md for the full story (why this isn't a bigger,
 * gateway-special-cased "financial capability" kind).
 */
export const capabilityKind = pgEnum("capability_kind", [
  "api",
  "mcp",
  "agent",
  "model",
  "dataset",
  "credit",
]);

/** Visibility of a published capability in the marketplace. */
export const capabilityVisibility = pgEnum("capability_visibility", [
  "public",
  "unlisted",
  "private",
]);

/**
 * Verification lifecycle of a capability.
 *  - `draft`    — created but not published through the wizard (not listed).
 *  - `pending`  — published and fully usable (listed + callable), but Tael has
 *                 not vetted it yet, so it shows without the trust badge.
 *  - `verified` — Tael-vetted; carries the green "Verified" badge.
 * Only Tael grants `verified` (first-party listings + reviewed third parties).
 */
export const capabilityStatus = pgEnum("capability_status", ["draft", "pending", "verified"]);

/** Lifecycle of a payment / settlement. Mirrors @tael/types paymentStatus. */
export const paymentStatus = pgEnum("payment_status", ["pending", "settled", "failed", "refunded"]);
