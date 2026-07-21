/**
 * Model for the chat agent loop. Deliberately separate from
 * `@tael/claude`'s `CLAUDE_MODEL` (Haiku, scoped to the cheap, high-volume
 * FAQ-generation path) — the chat agent needs to reason about which
 * capability to search for and how to explain a result, so it runs on Opus
 * per the tracking issue (#42).
 */
export const CHAT_MODEL = "claude-opus-4-8" as const;

export const MAX_TOKENS = 2048;
