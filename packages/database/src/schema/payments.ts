import { index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { paymentStatus, primaryId, timestamps } from "./_shared";
import { capabilities } from "./capabilities";
import { agents } from "./agents";

/**
 * The settlement ledger: one row per x402 payment for a capability call.
 * `txHash` is the Stellar transaction once settled. Capability/agent references
 * are nulled (not cascaded) so the ledger survives if either is later deleted —
 * a financial record must be immutable history.
 */
export const payments = pgTable(
  "payments",
  {
    id: primaryId(),
    capabilityId: uuid("capability_id").references(() => capabilities.id, { onDelete: "set null" }),
    agentId: uuid("agent_id").references(() => agents.id, { onDelete: "set null" }),

    /** Payer + payee Stellar addresses (denormalized so history is self-contained). */
    payer: text("payer").notNull(),
    payee: text("payee").notNull(),
    /** Amount the payee (builder) receives, in USDC. */
    amount: numeric("amount", { precision: 20, scale: 7 }).notNull(),
    /** Marketplace fee taken by Tael in the same transaction, in USDC. */
    fee: numeric("fee", { precision: 20, scale: 7 }).notNull().default("0"),

    status: paymentStatus("status").notNull().default("pending"),
    /** Stellar transaction hash once settled; null while pending. */
    txHash: text("tx_hash"),
    ...timestamps,
  },
  (table) => [
    index("payments_capability_id_idx").on(table.capabilityId),
    index("payments_agent_id_idx").on(table.agentId),
    index("payments_payer_idx").on(table.payer),
    index("payments_payee_idx").on(table.payee),
    index("payments_status_idx").on(table.status),
  ],
);

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
