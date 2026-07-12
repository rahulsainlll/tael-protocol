import { CLAUDE_MODEL } from "./client";

/**
 * A usage-based AI action. The publisher — not Tael — pays for these; today the
 * cost is recorded (and, for now, absorbed in dev) via {@link recordAiUsage}, and
 * later it debits the user's USDC balance before the call is allowed.
 */
export interface AiUsage {
  /** Which action was billed, e.g. "faq_generation". */
  action: string;
  /** The Stellar address of the user who should pay. */
  userAddress: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Record (and eventually charge) a metered AI action. Dev stub: logs the usage.
 * The billing seam lives here so the publish flow never needs to change when we
 * wire real per-call debits against the user's balance.
 */
export function recordAiUsage(usage: AiUsage): void {
  // TODO(billing): debit `usage.userAddress`'s balance for the AI cost.

  console.info(
    `[ai usage] ${usage.action} model=${usage.model} in=${usage.inputTokens} out=${usage.outputTokens} user=${usage.userAddress}`,
  );
}

export { CLAUDE_MODEL };
