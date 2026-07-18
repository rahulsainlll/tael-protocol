"use client";

import { useState } from "react";
import { ChatHeader } from "./ChatHeader";
import { Composer } from "./Composer";
import { MessageList, type DisplayMessage } from "./MessageList";

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `msg_${idCounter}`;
}

export function ChatWindow({ address }: { address: string }) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  async function send(text: string) {
    if (!text.trim() || sending) return;

    const userMessage: DisplayMessage = { id: nextId(), role: "user", content: text };
    const assistantId = nextId();
    const history = [...messages, userMessage];

    setMessages([...history, { id: assistantId, role: "assistant", content: "" }]);
    setDraft("");
    setSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok || !response.body) throw new Error(`Chat request failed (${response.status})`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages((current) =>
          current.map((m) => (m.id === assistantId ? { ...m, content: accumulated } : m)),
        );
      }
    } catch (error) {
      console.error("[chat] send failed:", error);
      setMessages((current) =>
        current.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong sending that. Please retry." }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader address={address} />
      <MessageList messages={messages} onSuggestionClick={(text) => void send(text)} />
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => void send(draft)}
        disabled={sending}
      />
    </div>
  );
}