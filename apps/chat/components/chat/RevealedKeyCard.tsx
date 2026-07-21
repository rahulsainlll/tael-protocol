"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, X } from "lucide-react";
import { Button } from "@tael/ui";
import type { RevealPayload } from "../../features/chat/reveal-protocol";

/**
 * Shown once, right after create_api_key succeeds, entirely client-side.
 * `secret` comes from useChat's `revealedSecret` — state that only ever
 * lives in this component tree, never in the `messages` array, so it's
 * never persisted to chat_messages and never resent to the model. Dismiss
 * (or navigating away) is the only way to close it — matches the dashboard's
 * "shown once, then never again" behavior for key creation.
 */
export function RevealedKeyCard({
  secret,
  onDismiss,
}: {
  secret: RevealPayload;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(secret.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-2 sm:px-6">
      <div className="rounded-lg border border-[#156DFC]/30 bg-[#156DFC]/5 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <KeyRound className="h-4 w-4 text-[#156DFC]" />
            New API key{secret.cardName ? ` — linked to ${secret.cardName}` : ""}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          This is shown once and can&apos;t be retrieved again — copy it now.
        </p>

        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs">
            {secret.value}
          </code>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
    </div>
  );
}
