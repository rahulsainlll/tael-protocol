import { index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { users } from "./users";

/**
 * A funding wallet owned by a user. The Stellar chain is the source of truth for
 * balance; `balanceCached` is a convenience snapshot for fast dashboard reads.
 */
export const wallets = pgTable(
  "wallets",
  {
    id: primaryId(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Stellar address holding the funds. */
    address: text("address").notNull().unique(),
    /** Human label, e.g. "Main" / "Research agent". */
    label: text("label").notNull().default("Main"),
    /**
     * Encrypted Stellar secret key (AES-256-GCM, via @tael/database crypto) for
     * hot wallets Tael signs from on the agent's behalf. Null for watch-only /
     * externally-held wallets. NEVER selected into client-facing queries.
     */
    secretEnc: text("secret_enc"),
    /** Cached USDC balance as a decimal string (chain remains authoritative). */
    balanceCached: numeric("balance_cached", { precision: 20, scale: 7 }).notNull().default("0"),
    ...timestamps,
  },
  (table) => [index("wallets_owner_id_idx").on(table.ownerId)],
);

export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
