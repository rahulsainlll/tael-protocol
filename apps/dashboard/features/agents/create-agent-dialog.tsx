"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Wallet } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
import { createAgent } from "./actions";

/**
 * Create an agent with a fresh hot wallet. Two steps: (1) name + spending caps,
 * (2) show the public funding address. The secret key is generated + encrypted
 * server-side and never reaches the browser.
 */
export function CreateAgentDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [maxPerCall, setMaxPerCall] = useState("0.10");
  const [dailyLimit, setDailyLimit] = useState("5.00");

  function reset() {
    setError(null);
    setAddress(null);
    setName("");
    setMaxPerCall("0.10");
    setDailyLimit("5.00");
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createAgent({ name, maxPerCall, dailyLimit });
      if (res.ok && res.address) {
        setAddress(res.address);
        router.refresh();
      } else {
        setError(res.error ?? "Could not create the agent.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New agent</Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md overflow-hidden">
          {address ? (
            <FundStep address={address} onDone={() => setOpen(false)} />
          ) : (
            <>
              <DialogHeader className="min-w-0">
                <DialogTitle>New agent</DialogTitle>
                <DialogDescription>
                  Tael creates a wallet the agent pays from. You fund it and set a spending cap it
                  cannot exceed.
                </DialogDescription>
              </DialogHeader>

              <div className="min-w-0 space-y-4">
                <Field label="Name">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Research agent"
                    autoFocus
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Max per call (USDC)">
                    <Input value={maxPerCall} onChange={(e) => setMaxPerCall(e.target.value)} />
                  </Field>
                  <Field label="Daily limit (USDC)">
                    <Input value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
                  </Field>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button className="w-full" onClick={submit} disabled={pending || !name.trim()}>
                  {pending ? "Creating…" : "Create agent wallet"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function FundStep({ address, onDone }: { address: string; onDone: () => void }) {
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
    <>
      <DialogHeader className="min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
          <Wallet className="h-5 w-5 text-emerald-600" />
        </div>
        <DialogTitle className="pt-2">Agent created</DialogTitle>
        <DialogDescription>
          Fund this wallet with USDC (testnet for now). The agent pays from it, up to your cap.
        </DialogDescription>
      </DialogHeader>

      <div className="min-w-0 space-y-4">
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Funding address
          </span>
          <div className="relative min-w-0 overflow-hidden rounded-lg border bg-muted/40">
            <button
              type="button"
              onClick={copy}
              aria-label={copied ? "Copied" : "Copy"}
              className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <p className="break-all p-3 pr-10 font-mono text-sm">{address}</p>
          </div>
        </div>

        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
