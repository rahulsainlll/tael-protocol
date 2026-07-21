import { Bot, User } from "lucide-react";
import { cn } from "@tael/ui";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What is Tael?",
  "How do payments settle?",
  "What's a Card, and what are its caps?",
];

export function MessageList({
  messages,
  onSuggestionClick,
}: {
  messages: DisplayMessage[];
  onSuggestionClick: (text: string) => void;
}) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-lg font-medium">What can I help with?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ask anything about Tael — how it works, what it's for, how payments settle.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
      {messages.map((message) => (
        <div key={message.id} className="flex gap-3">
          <div
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border",
              message.role === "assistant" ? "bg-muted" : "bg-transparent",
            )}
          >
            {message.role === "assistant" ? (
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <User className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 whitespace-pre-wrap pt-0.5 text-sm leading-relaxed">
            {message.content || <span className="text-muted-foreground">Thinking…</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
