import Anthropic from "@anthropic-ai/sdk";

/**
 * The cheapest current Claude model — used for the low-stakes FAQ generation on
 * capability publish. Deliberately not Opus/Sonnet: this is a high-volume, cost-
 * sensitive path, and the publisher (not Tael) ultimately pays for it.
 */
export const CLAUDE_MODEL = "claude-haiku-4-5" as const;

let singleton: Anthropic | undefined;

/** Process-wide Anthropic client from `ANTHROPIC_API_KEY`. Throws early if unset. */
export function getClaude(): Anthropic {
  if (!singleton) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    singleton = new Anthropic();
  }
  return singleton;
}
