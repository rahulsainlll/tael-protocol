import { getCapabilityBySlug, searchCapabilities } from "./capabilities";

/** Threaded through every tool call. Grows as later PRs add tools that need it. */
export interface ToolContext {
  userId: string;
}

export interface ToolResult {
  /** JSON-serializable payload sent back to the model as the tool_result. */
  forModel: unknown;
  /** One short line describing what happened, shown inline in the transcript. */
  summary: string;
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
  _ctx: ToolContext,
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
    default:
      return {
        forModel: { error: `Unknown tool "${name}".` },
        summary: `Tried to use an unknown tool "${name}".`,
      };
  }
}
