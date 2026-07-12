# @tael/claude

Claude-powered helpers for Tael, via the official Anthropic SDK.

## What it does

- `generateFaqQuestions({ kind, name, description, userAddress })` — on capability publish, asks
  **Claude Haiku** (the cheapest model) for 3–5 buyer-relevant FAQ questions the publisher must
  answer. Uses structured outputs + prompt caching; falls back to a static set if the API is
  unavailable so publishing never blocks.

## Cost model

AI actions here are **metered and paid by the publisher**, not Tael. `recordAiUsage()` is the billing
seam — today it logs usage (dev absorbs the tiny Haiku cost); later it debits the user's USDC balance
before the call. The publish flow never changes when real billing lands.

## Env

- `ANTHROPIC_API_KEY` — required for live calls. Without it, callers get the static fallback.

## Boundaries

- **Belongs here:** Claude/Anthropic API usage.
- **Never here:** persistence (that's `@tael/database`), payment settlement (`@tael/stellar`), or
  app-specific composition.
