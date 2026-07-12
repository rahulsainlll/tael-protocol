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
 * copy-paste x402 curl example. The payment *is* the auth — no keys, no signup.
 */
export function UseCapabilityDialog({ endpoint, price }: { endpoint: string; price: string }) {
  const [open, setOpen] = useState(false);

  const curl = [
    `# 1. Call it — you'll get a 402 with the price and pay-to address`,
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Use this capability</DialogTitle>
            <DialogDescription>
              Point your agent at this endpoint. It pays per call in USDC over x402 — no accounts,
              no API keys.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Endpoint
              </span>
              <CopyRow value={endpoint} mono />
            </div>

            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" /> Quick start
              </span>
              <CopyRow value={curl} block />
            </div>

            <a
              href="/docs/accept-payments"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
            >
              How x402 payments work <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CopyRow({ value, mono, block }: { value: string; mono?: boolean; block?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — no-op.
    }
  }

  return (
    <div className="relative rounded-lg border bg-muted/40">
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copied" : "Copy"}
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
      {block ? (
        <pre className="overflow-x-auto p-3 pr-10 text-xs leading-relaxed">
          <code>{value}</code>
        </pre>
      ) : (
        <p className={`p-3 pr-10 text-sm ${mono ? "font-mono" : ""} break-all`}>{value}</p>
      )}
    </div>
  );
}
