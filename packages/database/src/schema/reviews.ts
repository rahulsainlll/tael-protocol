import { index, integer, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { capabilities } from "./capabilities";
import { users } from "./users";

/**
 * A buyer's review of a capability: a 1–5 star rating and an optional comment.
 * One review per (capability, reviewer); a reviewer may only review a capability
 * they have paid for (enforced in the action, not the schema).
 */
export const reviews = pgTable(
  "reviews",
  {
    id: primaryId(),
    capabilityId: uuid("capability_id")
      .notNull()
      .references(() => capabilities.id, { onDelete: "cascade" }),
    reviewerId: uuid("reviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** 1–5 stars. */
    rating: integer("rating").notNull(),
    comment: text("comment"),
    ...timestamps,
  },
  (table) => [
    index("reviews_capability_id_idx").on(table.capabilityId),
    unique("reviews_capability_reviewer_unique").on(table.capabilityId, table.reviewerId),
  ],
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
