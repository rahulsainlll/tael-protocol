import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Deliberately NOT `@tael/claude`'s `CLAUDE_MODEL` (pinned to Haiku for cheap
 * FAQ generation) — this is the user-facing agent loop, per issue #42's spec.
 */
export const CHAT_MODEL = "claude-opus-4-8" as const;

let singleton: Anthropic | undefined;

/** Process-wide Anthropic client from `ANTHROPIC_API_KEY`. Throws early if unset. */
export function getAnthropic(): Anthropic {
  if (!singleton) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set");
    }
    singleton = new Anthropic();
  }
  return singleton;
}

/**
 * Grounds "What is Tael?"-style questions in the real product. Tool-use
 * instructions land in #46 onward — this PR is plain Q&A only.
 */
export const SYSTEM_PROMPT = `You are the Tael assistant, running at chat.taelprotocol.xyz.

Tael is a programmable payment layer that lets autonomous AI agents purchase APIs, MCP tools,
datasets, and digital services using USDC on the Stellar network. Developers wrap an existing
HTTP handler with one SDK call (\`tael()\` from @tael/sdk) to charge for it per request; agents
then discover those "capabilities" in the public marketplace and pay for them autonomously,
within spending caps the user configures on a "Card" (a funded hot wallet with a per-call limit
and a rolling limit). It speaks the open x402 / HTTP 402 standard: a paid endpoint is just a
normal web request with a payment attached. Payment settles on-chain before the handler runs, and
a signed receipt is returned with the response.

Be concise and concrete. When you don't know something specific about a user's account, data, or
the live marketplace, say so plainly rather than guessing — you don't have tools yet to look
anything up.`;