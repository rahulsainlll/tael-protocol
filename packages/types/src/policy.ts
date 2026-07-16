import { z } from "zod";
import { moneyAmountSchema } from "./money";
import { capabilityKindSchema } from "./capability";

/**
 * A user-defined spending policy that scopes what an agent may purchase.
 * Enforced off-chain today; designed to map onto an on-chain policy contract
 * (see contracts/) so a compromised agent still cannot exceed these limits.
 */
export const spendingPolicySchema = z.object({
  /** Maximum amount for any single call. */
  maxPerCall: moneyAmountSchema,
  /** Rolling 24h budget. */
  dailyLimit: moneyAmountSchema,
  /** If set, only these capability kinds are purchasable. */
  allowedKinds: z.array(capabilityKindSchema).optional(),
  /** Publisher ids the agent may never pay. */
  blockedPublishers: z.array(z.string()).default([]),
  /**
   * Opt-in: when true, a call whose price exceeds the wallet's USDC balance may
   * draw the shortfall from a TrustLine credit line (if the wallet has one)
   * instead of failing — an explicit, per-agent decision to let the agent take
   * on debt autonomously. Absent/false means no auto-borrow (the default for
   * every existing agent and DB row). Still bounded by maxPerCall/dailyLimit.
   * Left `.optional()` (not `.default(false)`) so the parsed type stays
   * backward-compatible with policy objects/rows written before this field
   * existed — read it as `policy?.allowCreditDraw` (undefined ⇒ off).
   */
  allowCreditDraw: z.boolean().optional(),
});

export type SpendingPolicy = z.infer<typeof spendingPolicySchema>;
