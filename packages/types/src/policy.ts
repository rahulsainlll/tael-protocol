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
});

export type SpendingPolicy = z.infer<typeof spendingPolicySchema>;
