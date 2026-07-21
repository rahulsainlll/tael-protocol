import type Anthropic from "@anthropic-ai/sdk";

/**
 * Discovery-only tools: reading the public marketplace. No side effects, no
 * spending — safe to let the model call freely.
 */
export const DISCOVERY_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_capabilities",
    description:
      "Search the public Tael capability marketplace by keyword. Matches against each " +
      "capability's name and description. Use this whenever the user asks what's available, " +
      "or describes something they want to do (an API, MCP tool, dataset, agent, or model) " +
      "without naming an exact capability. Returns a short list — call get_capability for full " +
      "pricing and sample request/response detail on any result the user cares about.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: 'Keywords to search for, e.g. "weather forecast" or "pdf ocr".',
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_capability",
    description:
      "Get full public detail for one capability by its exact slug: price per call, its FAQ, " +
      "and every operation it exposes with sample request/response payloads. Call this before " +
      "telling the user a specific price — never state a price or slug you haven't looked up " +
      "this way.",
    input_schema: {
      type: "object",
      properties: {
        slug: {
          type: "string",
          description: "The capability's slug, from a prior search_capabilities result.",
        },
      },
      required: ["slug"],
    },
  },
];
