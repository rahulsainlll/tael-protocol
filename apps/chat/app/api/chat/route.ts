import { getClaude } from "@tael/claude";
import { getSession } from "../../../lib/auth";
import { getCurrentUser } from "../../../features/auth/current-user";
import { CHAT_MODEL, MAX_TOKENS } from "../../../features/chat/model";
import { SYSTEM_PROMPT } from "../../../features/chat/system-prompt";
import type { ChatRequestBody } from "../../../features/chat/types";
import {
  appendMessage,
  assertOwnsThread,
  createThread,
  maybeSetTitle,
} from "../../../features/threads/queries";

// Uses the Anthropic SDK directly (Node runtime — @anthropic-ai/sdk is not
// edge-safe) and streams back plain UTF-8 text deltas, which the client
// appends verbatim to the in-progress assistant message. No tool calling yet
// (#46) — this is a plain conversational loop.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();
  const user = await getCurrentUser();
  if (!session || !user) {
    return new Response(JSON.stringify({ error: "Not signed in." }), { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ChatRequestBody | null;
  if (!body?.messages?.length) {
    return new Response(JSON.stringify({ error: "Missing messages." }), { status: 400 });
  }

  const lastUserMessage = body.messages[body.messages.length - 1];
  if (lastUserMessage?.role !== "user") {
    return new Response(JSON.stringify({ error: "Last message must be from the user." }), {
      status: 400,
    });
  }

  // Resolve (or create) the thread this turn belongs to, up front, so we can
  // persist the user's message before we even call the model.
  let threadId = body.threadId;
  const isNewThread = !threadId;
  if (threadId) {
    const owns = await assertOwnsThread(threadId, user.id);
    if (!owns) {
      return new Response(JSON.stringify({ error: "Thread not found." }), { status: 404 });
    }
  } else {
    const thread = await createThread(user.id);
    threadId = thread.id;
  }

  await appendMessage(threadId, "user", lastUserMessage.content);
  if (isNewThread) await maybeSetTitle(threadId, lastUserMessage.content);

  const client = getClaude();
  const resolvedThreadId = threadId;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let fullText = "";
      try {
        const anthropicStream = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
        });

        anthropicStream.on("text", (delta) => {
          fullText += delta;
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        if (fullText.trim()) {
          await appendMessage(resolvedThreadId, "assistant", fullText);
        }
        controller.close();
      } catch (error) {
        console.error("[chat] stream failed:", error);
        const fallback = "Something went wrong generating a response. Please try again.";
        controller.enqueue(encoder.encode(`\n\n${fallback}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // The client reads this to redirect from "/" to "/c/<id>" on the very
      // first turn of a new thread, once the reply has fully streamed in.
      "x-thread-id": resolvedThreadId,
    },
  });
}
