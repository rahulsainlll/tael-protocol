"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatMessage } from "./types";
import { extractReveals, type RevealPayload } from "./reveal-protocol";

function newId(): string {
  return crypto.randomUUID();
}

/**
 * Owns the in-memory message list and the streaming request/response cycle
 * for one thread. `threadId` is undefined for a brand-new chat — the first
 * send creates the thread server-side (see /api/chat) and this hook picks up
 * the new id from the `x-thread-id` response header, then pushes the URL to
 * `/c/<id>` once the reply has fully streamed in (not as soon as the id is
 * known — that would unmount this page mid-stream, since "/" and
 * "/c/[threadId]" are different route segments).
 */
export function useChat({
  threadId: initialThreadId,
  initialMessages = [],
}: {
  threadId?: string;
  initialMessages?: ChatMessage[];
} = {}) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A revealed secret (e.g. a freshly created API key) is client-only state —
  // it never enters `messages`, so it's never persisted and never resent to
  // the model. Cleared on every new send() and whenever the caller dismisses
  // it (see RevealedKeyCard).
  const [revealedSecret, setRevealedSecret] = useState<RevealPayload | null>(null);
  const threadIdRef = useRef(initialThreadId);
  const abortRef = useRef<AbortController | null>(null);

  const dismissReveal = useCallback(() => setRevealedSecret(null), []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setRevealedSecret(null);
      const userMessage: ChatMessage = { id: newId(), role: "user", content: trimmed };
      const assistantId = newId();
      const nextMessages = [...messages, userMessage];
      setMessages([...nextMessages, { id: assistantId, role: "assistant", content: "" }]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: nextMessages, threadId: threadIdRef.current }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? `Request failed (${res.status}).`);
        }

        const returnedThreadId = res.headers.get("x-thread-id");
        const isFirstTurn = Boolean(returnedThreadId && !threadIdRef.current);
        if (returnedThreadId) threadIdRef.current = returnedThreadId;

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        // Raw, un-stripped text accumulated so far this turn. extractReveals
        // re-scans the whole thing on every chunk (not just the delta) so a
        // reveal marker split across two chunks/reads is handled correctly —
        // it just shows up as "pending" until the rest arrives.
        let rawBuffer = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          rawBuffer += decoder.decode(value, { stream: true });
          const { visible, reveals } = extractReveals(rawBuffer);
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: visible } : m)),
          );
          if (reveals.length > 0) {
            // Only ever one create_api_key call is expected per turn in
            // practice; if more ever arrive, keep the most recent.
            setRevealedSecret(reveals[reveals.length - 1] ?? null);
          }
        }

        if (isFirstTurn && returnedThreadId) {
          router.replace(`/c/${returnedThreadId}`, { scroll: false });
          // The sidebar's thread list is fetched server-side in the layout;
          // refresh once so the brand-new thread shows up without a manual reload.
          router.refresh();
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, router],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { messages, isStreaming, error, send, stop, revealedSecret, dismissReveal };
}
