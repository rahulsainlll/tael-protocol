"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink, Terminal } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@tael/ui";

/**
 * Shows how to actually call a capability: its live gateway endpoint plus a
 * copy-paste x402 curl example. The payment is the auth (no keys, no signup).
 */
export function UseCapabilityDialog({ endpoint, price }: { endpoint: string; price: string }) {
  const [open, setOpen] = useState(false);

  const curl = [
    `# 1. Call it: you'll get a 402 with the price and pay-to address`,
    `curl -i ${endpoint}`,
    ``,
    `# 2. Pay ${price} USDC, then retry with the signed payment proof`,
    `curl ${endpoint} \\`,
    `  -H "X-PAYMENT: <base64 payment proof>"`,
  ].join("\n");

  return (
    <>
      <Button onClick={() => setOpen(true)}>Use capability</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg overflow-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle>Use this capability</DialogTitle>
            <DialogDescription>
              Point your agent at this endpoint. It pays per call in USDC over x402, with no
              accounts and no API keys.
            </DialogDescription>
          </DialogHeader>

          <div className="min-w-0 space-y-4">
            <div className="min-w-0 space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Endpoint
              </span>
              {/* Single-line, truncated: URLs are long, wrapping looks messy. */}
              <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 py-2 pl-3 pr-2">
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{endpoint}</span>
                <CopyButton value={endpoint} />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" /> Quick start
              </span>
              {/* Multi-line code: scrolls horizontally inside a clipped box. */}
              <div className="relative min-w-0 overflow-hidden rounded-lg border bg-muted/40">
                <div className="absolute right-2 top-2 z-10">
                  <CopyButton value={curl} />
                </div>
                <pre className="min-w-0 overflow-x-auto p-3 pr-12 text-xs leading-relaxed">
                  <code>{curl}</code>
                </pre>
              </div>
            </div>

            <a
              href="https://taelprotocol.xyz/docs/accept-payments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
            >
              How x402 payments work <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable, no-op.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : "Copy"}
      className="shrink-0 rounded-md bg-muted/40 p-1.5 text-muted-foreground backdrop-blur transition-[color,transform] duration-100 ease-out hover:text-foreground active:scale-95"
    >
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
