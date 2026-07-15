"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** The connected wallet address with a copy button. */
export function WalletAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-sm">{address}</span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy address"}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-[color,transform] duration-100 ease-out hover:text-foreground active:scale-95"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
