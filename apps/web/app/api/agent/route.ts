import { Resend } from "resend";
import { TAEL_SYSTEM_PROMPT } from "../../_components/agent/knowledge";

// The site's Tael Agent. Talks to OpenRouter (OpenAI-compatible) so the model is
// swappable with one key — default Gemini 2.5 Flash. Streams the reply back as
// plain UTF-8 text deltas, which the widget appends to the assistant message.
// Node runtime: this route reads a server-only key and uses Resend (not edge-safe).
export const runtime = "nodejs";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Swap the model with one env var (any OpenRouter slug), no code change.
const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash";
// Support answers are short; capping output keeps latency + cost down.
const MAX_TOKENS = 500;

interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

interface AgentRequestBody {
  messages: AgentMessage[];
}

interface StreamChunk {
  choices?: { delta?: { content?: string } }[];
}

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;

/**
 * When a visitor drops their email, forward it to the Tael team (fire-and-forget)
 * with the recent conversation so they can follow up on an issue or a meeting.
 * Reuses the same Resend config as the waitlist; no config → silently skipped.
 */
async function notifyTeam(email: string, messages: AgentMessage[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const notify = process.env.AGENT_NOTIFY_EMAIL ?? process.env.WAITLIST_NOTIFY_EMAIL;
  const from = process.env.WAITLIST_FROM_EMAIL ?? "Tael <onboarding@resend.dev>";
  if (!apiKey || !notify) return;
  // Topic for the subject = the visitor's first message; full transcript in the body.
  const firstUser = messages.find((m) => m.role === "user")?.content.trim() ?? "";
  const topic = firstUser.replace(/\s+/g, " ").slice(0, 70);
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Visitor" : "Tael"}: ${m.content}`)
    .join("\n");
  try {
    await new Resend(apiKey).emails.send({
      from,
      to: notify,
      replyTo: email,
      subject: topic ? `Tael lead: ${email} — ${topic}` : `Tael lead: ${email}`,
      text: `A visitor left their email in the Tael assistant — the team should follow up.\n\nEmail: ${email}\n\nFull conversation:\n${transcript}`,
    });
  } catch (error) {
    console.error("[agent] team notification failed:", error);
  }
}

function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "The assistant isn't configured yet (missing OPENROUTER_API_KEY)." }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const body = (await request.json().catch(() => null)) as AgentRequestBody | null;
  const messages = body?.messages;
  if (!messages?.length || messages[messages.length - 1]?.role !== "user") {
    return new Response(JSON.stringify({ error: "The last message must be from the user." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // If the visitor dropped their email, forward it to the team (non-blocking).
  const lastUser = messages[messages.length - 1];
  const emailMatch = lastUser?.content.match(EMAIL_RE);
  if (emailMatch) void notifyTeam(emailMatch[0], messages);

  // Last 20 turns is plenty of context and keeps cost predictable.
  const recent = messages.slice(-20);
  const chatMessages = [
    { role: "system", content: TAEL_SYSTEM_PROMPT },
    ...recent.map((m) => ({ role: m.role, content: m.content })),
  ];

  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
        // Optional attribution shown on OpenRouter; harmless if ignored.
        "HTTP-Referer": "https://taelprotocol.xyz",
        "X-Title": "Tael Agent",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: MAX_TOKENS,
        temperature: 0.4,
      }),
    });
  } catch (error) {
    console.error("[agent] openrouter request failed:", error);
    return textResponse("Sorry, something went wrong on my end. Please try again.");
  }

  if (!upstream.ok || !upstream.body) {
    console.error(
      "[agent] openrouter error:",
      upstream.status,
      await upstream.text().catch(() => ""),
    );
    return textResponse("Sorry, the assistant is unavailable right now. Please try again.");
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = upstream.body!.getReader();
      let buffer = "";
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // OpenRouter streams OpenAI-style SSE: `data: {json}\n\n`, `data: [DONE]`.
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              const text = chunk.choices?.[0]?.delta?.content;
              if (text) controller.enqueue(encoder.encode(text));
            } catch {
              // ignore keep-alive comments / partial frames
            }
          }
        }
        controller.close();
      } catch (error) {
        console.error("[agent] stream failed:", error);
        controller.enqueue(encoder.encode("Sorry, something went wrong. Please try again."));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}
