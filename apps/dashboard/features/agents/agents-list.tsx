"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, Copy } from "lucide-react";
import { Button } from "@tael/ui";
import { provisionAgent } from "./actions";
import type { AgentWallet } from "./queries";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

export function AgentsList({ agents }: { agents: AgentWallet[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {agents.map((a) => (
        <AgentCard key={a.agentId} agent={a} />
      ))}
    </div>
  );
}

function AgentCard({ agent: a }: { agent: AgentWallet }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(a.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  function provision() {
    setError(null);
    startTransition(async () => {
      const res = await provisionAgent(a.agentId);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Could not provision.");
    });
  }

  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
            <Bot className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="font-medium leading-tight">{a.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{truncate(a.address)}</p>
          </div>
        </div>
        {a.ready ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
            Ready
          </span>
        ) : (
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
            Not ready
          </span>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
          <p className="mt-0.5 text-xl font-semibold tabular-nums">
            ${Number(a.usdc).toFixed(2)}{" "}
            <span className="text-sm font-normal text-muted-foreground">USDC</span>
          </p>
        </div>
        {a.policy ? (
          <div className="text-right text-xs text-muted-foreground">
            <p>
              max <span className="tabular-nums text-foreground">${a.policy.maxPerCall}</span>/call
            </p>
            <p>
              <span className="tabular-nums text-foreground">${a.policy.dailyLimit}</span>/day
            </p>
          </div>
        ) : null}
      </div>

      {a.ready ? (
        <div className="mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
            {a.address}
          </span>
          <button
            type="button"
            onClick={copyAddress}
            aria-label={copied ? "Copied" : "Copy funding address"}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={provision}
            disabled={pending}
          >
            {pending ? "Provisioning…" : "Provision wallet"}
          </Button>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      )}
    </div>
  );
}
