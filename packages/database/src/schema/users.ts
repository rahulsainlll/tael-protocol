import { index, pgTable, text } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";

/**
 * A user is identified by their Stellar wallet address (Sign-In-With-Stellar).
 * No email/password — the wallet is the identity.
 */
export const users = pgTable(
  "users",
  {
    id: primaryId(),
    /** Stellar public key `G...` — the canonical identity, unique. */
    walletAddress: text("wallet_address").notNull().unique(),
    /** Optional display name the user sets later. */
    displayName: text("display_name"),
    ...timestamps,
  },
  (table) => [index("users_wallet_address_idx").on(table.walletAddress)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
