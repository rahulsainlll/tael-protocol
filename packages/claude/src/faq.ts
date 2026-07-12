import { z } from "zod";
import { CLAUDE_MODEL, getClaude } from "./client";
import { recordAiUsage } from "./usage";

/** A single publisher-answered FAQ shown publicly on the capability listing. */
export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export type Faq = z.infer<typeof faqSchema>;

const faqQuestionsSchema = z.object({
  questions: z.array(z.string()),
});

// Raw JSON schema for structured output. (We keep a hand-written schema rather
// than zodOutputFormat because that helper targets Zod v4 and the repo is Zod 3.)
const FAQ_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    questions: { type: "array", items: { type: "string" } },
  },
  required: ["questions"],
  additionalProperties: false,
} as const;

// Frozen system prompt → cacheable prefix (see @anthropic-ai/sdk prompt caching).
const SYSTEM_PROMPT = [
  "You help vet capabilities published to Tael, a marketplace where autonomous AI",
  "agents discover and pay per call for APIs, MCP tools, agents, datasets, and models.",
  "Given a capability's kind and description, produce a short FAQ that a buyer (an AI",
  "agent or its owner) would need answered before paying to use it.",
  "",
  "Rules:",
  "- Produce between 3 and 5 questions.",
  "- Questions must be specific to THIS capability, answerable by its publisher,",
  "  and useful for deciding whether to buy (inputs, outputs, limits, errors, auth).",
  "- No yes/no fluff, no marketing. Each question is one clear sentence.",
].join("\n");

export interface GenerateFaqInput {
  kind: string;
  name: string;
  description: string;
  /** Optional example request payload (JSON), sharpens the questions. */
  sampleRequest?: string;
  /** Optional example response payload (JSON), sharpens the questions. */
  sampleResponse?: string;
  /** Stellar address of the publisher — billed for this AI call. */
  userAddress: string;
}

function extractText(content: { type: string }[]): string {
  const block = content.find((b): b is { type: "text"; text: string } => b.type === "text");
  return block?.text ?? "";
}

/**
 * Generate 3–5 FAQ questions for a capability using the cheapest Claude model.
 * The publisher answers these before publishing; the Q&A becomes public.
 * Falls back to a small static set if the AI call fails, so publish never blocks.
 */
export async function generateFaqQuestions(input: GenerateFaqInput): Promise<string[]> {
  try {
    const client = getClaude();
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            `Kind: ${input.kind}`,
            `Name: ${input.name}`,
            `Description: ${input.description}`,
            input.sampleRequest ? `Sample request:\n${input.sampleRequest}` : "",
            input.sampleResponse ? `Sample response:\n${input.sampleResponse}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      output_config: { format: { type: "json_schema", schema: FAQ_OUTPUT_SCHEMA } },
    });

    recordAiUsage({
      action: "faq_generation",
      userAddress: input.userAddress,
      model: CLAUDE_MODEL,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    });

    const parsed = faqQuestionsSchema.safeParse(JSON.parse(extractText(response.content)));
    const questions = parsed.success
      ? parsed.data.questions.map((q) => q.trim()).filter(Boolean).slice(0, 5)
      : [];
    return questions.length >= 3 ? questions : fallbackQuestions(input.kind);
  } catch {
    return fallbackQuestions(input.kind);
  }
}

/** Generic questions used when the model is unavailable, keyed loosely by kind. */
function fallbackQuestions(kind: string): string[] {
  const common = [
    "What input does this capability expect, and in what format?",
    "What does it return on a successful call?",
    "How does it behave on errors or invalid input?",
  ];
  if (kind === "api" || kind === "mcp") {
    common.push("Are there rate limits or usage constraints a buyer should know about?");
  }
  return common;
}
