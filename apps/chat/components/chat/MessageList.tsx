"use client";

import { useEffect, useRef } from "react";
import { cn } from "@tael/ui";
import type { ChatMessage } from "../../features/chat/types";

const SUGGESTIONS = [
  "What can I do on Tael?",
  "Find me a weather API",
  "How does Manual mode work?",
];

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="space-y-1">
        <h1 className="text-lg font-medium text-foreground">Ask Tael anything.</h1>
        <p className="text-sm text-muted-foreground">
          Search capabilities, create an API key, and pay for calls — all in one thread.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            className="rounded-full border border-input px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75ch] whitespace-pre-wrap rounded-lg px-3.5 py-2.5 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        {message.content || <span className="animate-pulse text-muted-foreground">…</span>}
      </div>
    </div>
  );
}

export function MessageList({
  messages,
  onSuggestion,
}: {
  messages: ChatMessage[];
  onSuggestion: (text: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onPick={onSuggestion} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
      {messages.map((m) => (
        <Bubble key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
