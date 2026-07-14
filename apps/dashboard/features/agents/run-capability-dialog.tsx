"use client";

import { useState, useTransition } from "react";
import { Bot, Check, Play, Sparkles, TriangleAlert } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@tael/ui";
import { runCapability, type RunResult } from "./run-capability";
import type { AgentOption } from "./queries";

/**
 * Pay for a capability from one of your agents, from the UI. Picks an agent,
 * shows the price against its per-call cap, then signs + settles + calls in one
 * action. Motion follows the design rules: ease-out entrances, press feedback,
 * a fast step loader (perceived performance), tabular numbers.
 */
export function RunCapabilityDialog({
  slug,
  price,
  agents,
}: {
  slug: string;
  price: string;
  agents: AgentOption[];
}) {
  const [open, setOpen] = useState(false);
  const [agentId, setAgentId] = useState(agents[0]?.agentId ?? "");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RunResult | null>(null);

  const selected = agents.find((a) => a.agentId === agentId);
  const priceNum = Number(price);
  const overCap = selected?.policy ? priceNum > Number(selected.policy.maxPerCall) : false;

  function reset() {
    setResult(null);
  }

  function run() {
    setResult(null);
    startTransition(async () => {
      setResult(await runCapability({ agentId, slug }));
    });
  }

  const hasAgents = agents.length > 0;

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        <Play className="h-4 w-4" /> Run with agent
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle>Run with an agent</DialogTitle>
            <DialogDescription>
              Your agent pays {price ? `$${price}` : "the fee"} in USDC from its wallet and returns
              the result. Nothing exceeds the caps you set.
            </DialogDescription>
          </DialogHeader>

          {!hasAgents ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              You have no agents yet.{" "}
              <a href="/agents" className="font-medium text-foreground hover:underline">
                Create one
              </a>{" "}
              to run capabilities.
            </div>
          ) : result?.ok ? (
            <ResultView result={result} onClose={() => setOpen(false)} />
          ) : (
            <div className="min-w-0 space-y-4">
              {/* Agent picker */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Pay from
                </span>
                <div className="space-y-1.5">
                  {agents.map((a) => (
                    <button
                      key={a.agentId}
                      type="button"
                      onClick={() => setAgentId(a.agentId)}
                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-[border-color,background-color] duration-150 ${
                        a.agentId === agentId
                          ? "border-foreground/30 bg-muted/50"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                        <Bot className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{a.name}</span>
                        {a.policy ? (
                          <span className="block text-xs tabular-nums text-muted-foreground">
                            max ${a.policy.maxPerCall}/call · ${a.policy.dailyLimit}/day
                          </span>
                        ) : null}
                      </span>
                      {a.agentId === agentId ? (
                        <Check className="h-4 w-4 shrink-0 text-foreground" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + policy check */}
              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">This call costs</span>
                <span className="font-semibold tabular-nums">${price} USDC</span>
              </div>

              {overCap ? (
                <p className="flex items-center gap-1.5 text-sm text-amber-600">
                  <TriangleAlert className="h-4 w-4 shrink-0" /> Over this agent&apos;s per-call
                  cap.
                </p>
              ) : null}
              {result?.error ? (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <TriangleAlert className="h-4 w-4 shrink-0" /> {result.error}
                </p>
              ) : null}

              <Button
                className="w-full transition-transform duration-100 ease-out active:scale-[0.99]"
                onClick={run}
                disabled={pending || !agentId || overCap}
              >
                {pending ? <RunningLabel /> : <>Pay &amp; run</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** A fast, alive loading label — perceived performance while the tx settles. */
function RunningLabel() {
  return (
    <span className="flex items-center gap-2">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/40 border-t-background" />
      Paying &amp; settling…
    </span>
  );
}

function ResultView({ result, onClose }: { result: RunResult; onClose: () => void }) {
  let pretty = result.body ?? "";
  try {
    pretty = JSON.stringify(JSON.parse(result.body ?? ""), null, 2);
  } catch {
    // leave as-is
  }

  return (
    <div className="min-w-0 space-y-4 duration-200 ease-out animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        Paid ${result.paid} USDC · {result.status} OK
      </div>

      <div className="min-w-0 overflow-hidden rounded-lg border bg-muted/40">
        <pre className="max-h-64 min-w-0 overflow-auto p-3 text-xs leading-relaxed">
          <code>{pretty}</code>
        </pre>
      </div>

      <Button
        className="w-full transition-transform duration-100 ease-out active:scale-[0.99]"
        onClick={onClose}
      >
        Done
      </Button>
    </div>
  );
}
