"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowRight, Square } from "lucide-react";
import { Button, Textarea } from "@tael/ui";

export function Composer({
  isStreaming,
  onSend,
  onStop,
}: {
  isStreaming: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [value, setValue] = useState("");

  function submit() {
    if (!value.trim() || isStreaming) return;
    onSend(value);
    setValue("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border p-4">
      <div className="mx-auto flex max-w-2xl items-center gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Tael to find, link, or run a capability…"
          rows={1}
          className="max-h-40 min-h-[44px] resize-none"
        />
        {isStreaming ? (
          <Button type="button" variant="outline" size="icon" onClick={onStop} aria-label="Stop">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            onClick={submit}
            disabled={!value.trim()}
            aria-label="Send"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
