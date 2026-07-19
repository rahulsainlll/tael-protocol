"use client";

import { Composer } from "./Composer";
import { MessageList } from "./MessageList";
import { useChat } from "../../features/chat/use-chat";
import type { ChatMessage } from "../../features/chat/types";

export function ChatView({
  threadId,
  initialMessages,
}: {
  threadId?: string;
  initialMessages?: ChatMessage[];
}) {
  const { messages, isStreaming, error, send, stop } = useChat({ threadId, initialMessages });

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList messages={messages} onSuggestion={(text) => void send(text)} />
      {error ? (
        <p className="mx-auto w-full max-w-2xl px-4 pb-1 text-xs text-destructive">{error}</p>
      ) : null}
      <Composer isStreaming={isStreaming} onSend={(text) => void send(text)} onStop={stop} />
    </div>
  );
}
