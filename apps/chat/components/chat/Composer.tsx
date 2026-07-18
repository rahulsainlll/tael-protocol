"use client";

import { useState, type KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button, Textarea } from "@tael/ui";

export function Composer() {
  const [value, setValue] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function handleSend() {
    if (!value.trim()) return;
    setNote("Sending isn't wired up yet — streaming lands in the next PR.");
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="border-t border-border p-4">
      <div className="mx-auto max-w-2xl">
        {note ? <p className="mb-2 text-xs text-muted-foreground">{note}</p> : null}
        <div className="flex items-end gap-2">
          <Textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Tael to find, link, or run a capability…"
            rows={1}
            className="max-h-40 resize-none"
          />
          <Button size="icon" onClick={handleSend} disabled={!value.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}