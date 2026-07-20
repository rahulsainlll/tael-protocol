import { getCapabilityBySlug, searchCapabilities } from "./capabilities";
import { createApiKey, listCards } from "../../keys/queries";
import type { RevealPayload } from "../reveal-protocol";

/** Threaded through every tool call. Grows as later PRs add tools that need it. */
export interface ToolContext {
  userId: string;
}

export interface ToolResult {
  /** JSON-serializable payload sent back to the model as the tool_result. */
  forModel: unknown;
  /** One short line describing what happened, shown inline in the transcript. */
  summary: string;
  /**
   * Out-of-band payload for the client only — never included in `forModel`
   * (so it never reaches the model's context) and never persisted (the
   * route handler writes it to the live stream but keeps it out of the
   * transcript it saves to `chat_messages`). See reveal-protocol.ts.
   */
  reveal?: RevealPayload;
}

/**
 * Runs one tool call by name. Unknown tool names return a model-facing error
 * instead of throwing, so a stray/older tool name never crashes the whole
 * turn — the model just sees a normal tool_result saying it failed and can
 * recover instead of the request 500ing.
 */
export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  switch (name) {
    case "search_capabilities": {
      const query = String(input.query ?? "").trim();
      if (!query) {
        return {
          forModel: { error: "Missing query." },
          summary: "Search skipped — no query given.",
        };
      }
      const results = await searchCapabilities(query);
      return {
        forModel: { results },
        summary:
          results.length === 0
            ? `Searched capabilities for "${query}" — no results.`
            : `Searched capabilities for "${query}" — ${results.length} result${results.length === 1 ? "" : "s"}.`,
      };
    }
    case "get_capability": {
      const slug = String(input.slug ?? "").trim();
      if (!slug) {
        return { forModel: { error: "Missing slug." }, summary: "Lookup skipped — no slug given." };
      }
      const capability = await getCapabilityBySlug(slug);
      return {
        forModel: capability ?? { error: `No public capability with slug "${slug}".` },
        summary: capability
          ? `Looked up "${capability.name}" (${slug}).`
          : `Looked up "${slug}" — not found.`,
      };
    }
    case "list_cards": {
      const cards = await listCards(ctx.userId);
      return {
        forModel: { cards },
        summary:
          cards.length === 0
            ? "Checked your Cards — you don't have any yet."
            : `Checked your Cards — ${cards.length} available.`,
      };
    }
    case "create_api_key": {
      const keyName = String(input.name ?? "").trim();
      const cardId = input.cardId ? String(input.cardId) : null;
      if (!keyName) {
        return { forModel: { error: "Missing name." }, summary: "Key creation skipped — no name given." };
      }
      const result = await createApiKey(ctx.userId, keyName, cardId);
      if (!result.ok || !result.key) {
        return {
          forModel: { ok: false, error: result.error ?? "Key creation failed." },
          summary: `Couldn't create the key: ${result.error ?? "unknown error"}`,
        };
      }
      // The raw key never goes in `forModel` — the model only ever sees the
      // prefix. It's delivered to the client exclusively via `reveal`,
      // which the route handler keeps out of both the persisted transcript
      // and any future tool_result the model receives. See
      // reveal-protocol.ts for why.
      return {
        forModel: { ok: true, prefix: result.prefix, card: result.card },
        summary: `Created API key "${keyName}"${result.card ? `, linked to "${result.card.name}"` : ""}.`,
        reveal: { type: "api_key", value: result.key, cardName: result.card?.name },
      };
    }
    default:
      return {
        forModel: { error: `Unknown tool "${name}".` },
        summary: `Tried to use an unknown tool "${name}".`,
      };
  }
}
