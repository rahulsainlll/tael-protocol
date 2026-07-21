import type Anthropic from "@anthropic-ai/sdk";

/**
 * `list_cards` isn't named on the tracking issue, but `create_api_key(name,
 * cardId)` needs a real `cardId` to link to, and this is a plain
 * conversational chat surface (no inline picker widget) — so the model needs
 * a safe, read-only way to see the user's Cards (id, name, caps) before it
 * can ask "which Card should this key spend from?" and resolve their answer
 * to an id. Same trust tier as the discovery tools from #46: read-only, no
 * spend, safe to call freely.
 */
export const KEY_TOOLS: Anthropic.Tool[] = [
  {
    name: "list_cards",
    description:
      "List the signed-in user's Cards (agent hot wallets), each with its spending caps " +
      "(max per call, daily limit). Call this before create_api_key whenever the user hasn't " +
      "already told you which Card by name — you need a real Card id, and this is the only " +
      "way to get one. If it returns no Cards, tell the user they need to create one in the " +
      "Tael dashboard first; this chat can't create Cards.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "create_api_key",
    description:
      "Create a new API key for the signed-in user, optionally linked to one of their Cards " +
      "(so calls made with it can be paid for automatically). You will NOT receive the raw key " +
      "value in this tool's result — only a prefix (e.g. tael_live_ab12cd) for reference. The " +
      "full key is shown to the user directly and securely by the interface itself, outside " +
      "this conversation. Do not state, guess, or attempt to reconstruct the raw key yourself. " +
      "If the key was linked to a Card, also confirm which Card and its spending caps (max " +
      "per call, daily limit) back to the user right after it's created.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: 'A short label for the key, e.g. "Chat agent" or "Research bot".',
        },
        cardId: {
          type: "string",
          description:
            "The id of the Card (from list_cards) to link this key to, so it can pay for " +
            "calls automatically. Omit only if the user explicitly wants an unlinked key.",
        },
      },
      required: ["name"],
    },
  },
];
