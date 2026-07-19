import type Anthropic from "@anthropic-ai/sdk";
import { DISCOVERY_TOOLS } from "./definitions";

/**
 * All tools the chat agent can call this turn. #47/#48 append
 * `create_api_key` / `call_capability` here as they land — kept as one list
 * so the API route doesn't need to change shape each time a tool is added.
 */
export const ALL_TOOLS: Anthropic.Tool[] = [...DISCOVERY_TOOLS];
