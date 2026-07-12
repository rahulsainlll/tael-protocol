import { index, jsonb, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { users } from "./users";
import { wallets } from "./wallets";
import type { SpendingPolicy } from "@tael/types";

/**
 * An autonomous agent owned by a user. It spends from a wallet within a
 * user-defined spending policy (max per call, daily limit, allowed kinds…).
 * The policy is stored as JSONB, typed to @tael/types SpendingPolicy.
 */
export const agents = pgTable(
  "agents",
  {
    id: primaryId(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** Wallet the agent spends from. Nulled (not deleted) if the wallet is removed. */
    walletId: uuid("wallet_id").references(() => wallets.id, { onDelete: "set null" }),
    /** Spending policy enforced before each purchase. */
    policy: jsonb("policy").$type<SpendingPolicy>(),
    ...timestamps,
  },
  (table) => [index("agents_owner_id_idx").on(table.ownerId)],
);

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
