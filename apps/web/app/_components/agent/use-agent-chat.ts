"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentMessage } from "./types";

let counter = 0;
function nextId(): string {
  counter += 1;
  return `m${counter}-${Date.now()}`;
}

/** Persist the conversation so the visitor's context survives a reload or leaving. */
const STORAGE_KEY = "tael-agent-chat";

function loadMessages(): AgentMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentMessage[]) : [];
  } catch {
    return [];
  }
}

/**
 * Owns the conversation and the streaming fetch. `send` optimistically appends
 * the user's message plus an empty assistant message, then fills that assistant
 * message token-by-token as the stream arrives, so the UI feels instant.
 */
export function useAgentChat(endpoint: string) {
  const [messages, setMessages] = useState<AgentMessage[]>(loadMessages);
  const [streaming, setStreaming] = useState(false);
  // Guards against overlapping sends (double-enter, clicking a suggestion mid-stream).
  const busy = useRef(false);

  // Save the conversation on every change (survives reload / the visitor leaving).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore — private mode / quota; persistence is a nice-to-have
    }
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || busy.current) return;
      busy.current = true;
      setStreaming(true);

      const now = Date.now();
      const userMsg: AgentMessage = { id: nextId(), role: "user", content, createdAt: now };
      const assistantId = nextId();
      const history = [...messages, userMsg];
      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", createdAt: now },
      ]);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok || !res.body) {
          const detail = await res
            .json()
            .then((j: { error?: string }) => j.error)
            .catch(() => null);
          throw new Error(detail ?? "request failed");
        }

        // Buffer the whole reply as it streams in, but don't paint it token by
        // token. The visitor sees the typing indicator while it generates, then
        // the complete message is revealed at once (with a fade, in the bubble).
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
        }
        acc += decoder.decode();
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
      } catch (error) {
        const message =
          error instanceof Error && error.message !== "request failed"
            ? error.message
            : "Sorry, I couldn't reach the server. Please try again.";
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: message } : m)),
        );
      } finally {
        busy.current = false;
        setStreaming(false);
      }
    },
    [endpoint, messages],
  );

  return { messages, streaming, send };
}
