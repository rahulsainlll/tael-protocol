import { NextResponse } from "next/server";
import { getSession } from "../../../lib/auth";
import { CHAT_MODEL, getAnthropic, SYSTEM_PROMPT } from "../../../lib/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages?: ChatTurn[];
}

/**
 * Stream a plain-text assistant reply token by token. No persistence yet (#45)
 * and no tools yet (#46+) — the client keeps the conversation in memory and
 * resends it each turn.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ChatRequestBody;
  const messages = body.messages ?? [];
  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json({ error: "Expected a trailing user message" }, { status: 400 });
  }

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (error) {
    console.error("[chat] ANTHROPIC_API_KEY missing:", error);
    return NextResponse.json({ error: "Chat is not configured" }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const anthropicStream = anthropic.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (error) {
        console.error("[chat] stream failed:", error);
        controller.enqueue(
          encoder.encode("\n\n_Something went wrong generating a response. Please retry._"),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}