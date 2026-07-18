/**
 * Metered (usage-based) billing for model capabilities — the "call → measure →
 * charge" path, distinct from x402's "pay → call". A metered capability calls
 * the upstream first, reads the token usage from the response, and charges the
 * exact cost. Pass-through: the buyer pays what the model actually cost us, at
 * 0% margin. Tael's revenue comes from the marketplace fee on OTHER capabilities.
 *
 * STAGE A: this module computes and reports the cost only. The gateway logs it
 * and charges $0 while we prove the token-reading + math on real calls. Stage B
 * wires the actual charge from the Card.
 */

/**
 * Per-token USDC rates by model, derived from published per-1M-token prices
 * (price ÷ 1,000,000). Keep in sync with the providers' pricing pages; this is
 * the one place to update when prices change. Zero margin — these are our cost.
 */
export const MODEL_RATES: Record<string, { input: number; output: number }> = {
  // Anthropic — https://www.anthropic.com/pricing ($ per 1M tokens)
  "claude-haiku-4-5": { input: 1 / 1_000_000, output: 5 / 1_000_000 },
  "claude-sonnet-4-6": { input: 3 / 1_000_000, output: 15 / 1_000_000 },
  "claude-opus-4-8": { input: 5 / 1_000_000, output: 25 / 1_000_000 },
};

/** Token counts read from an upstream response. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * The exact USDC cost of a metered call, as a 7-decimal string (USDC precision).
 * Returns null when the model has no configured rate — the caller must treat
 * that as "cannot bill" and fail safe rather than charge a guess.
 */
export function computeMeteredCost(model: string, usage: TokenUsage): string | null {
  const rate = MODEL_RATES[model];
  if (!rate) return null;
  const cost = usage.inputTokens * rate.input + usage.outputTokens * rate.output;
  return cost.toFixed(7);
}

/**
 * Extract token usage from an upstream JSON body. Handles Anthropic's shape
 * (`usage.input_tokens` / `usage.output_tokens`) and the OpenAI-style
 * (`usage.prompt_tokens` / `usage.completion_tokens`). Returns null if absent.
 */
export function readTokenUsage(body: string): TokenUsage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  const usage = (parsed as { usage?: Record<string, unknown> })?.usage;
  if (!usage || typeof usage !== "object") return null;

  const input = usage.input_tokens ?? usage.prompt_tokens;
  const output = usage.output_tokens ?? usage.completion_tokens;
  if (typeof input !== "number" || typeof output !== "number") return null;

  return { inputTokens: input, outputTokens: output };
}
