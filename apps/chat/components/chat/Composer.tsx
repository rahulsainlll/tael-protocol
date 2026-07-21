"use client";

import { type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button, Textarea } from "@tael/ui";

export function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (value.trim() && !disabled) onSend();
    }
  }

  return (
    <div className="border-t border-border p-4">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Tael, or run a capability…"
          disabled={disabled}
          rows={1}
          className="max-h-40 resize-none"
        />
        <Button size="icon" disabled={disabled || !value.trim()} onClick={onSend} aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
