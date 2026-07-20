"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, CreditCard, Play, Search, Sparkles, TriangleAlert } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
import { formatUsdc } from "../../lib/format";
import { runCapability, type RunResult } from "./run-capability";
import type { AgentOption } from "./queries";

/**
 * Pay for a capability from one of your agents, in the UI. Only agents that can
 * actually pay (enough balance, within their per-call cap) are offered. Motion
 * follows the design rules: ease-out entrances, press feedback, a fast loader.
 */
/** A specific priced operation to run (e.g. one MCP tool), when a capability
 *  exposes several. Omit to run the base capability. */
export interface RunOperation {
  slug: string;
  name: string;
  price: string;
  method?: string;
  body?: string;
}

export function RunCapabilityDialog({
  slug,
  price,
  agents,
  operation,
  trigger = "default",
}: {
  slug: string;
  price: string;
  agents: AgentOption[];
  operation?: RunOperation;
  /** "default" = the header "Run with card" button; "compact" = a small per-row Run. */
  trigger?: "default" | "compact";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RunResult | null>(null);
  const [query, setQuery] = useState("");

  const runPrice = operation ? operation.price : price;
  const runLabel = operation?.name;
  const priceNum = Number(runPrice);

  // GET ops take query params (e.g. address=G…); others take a JSON body. Prefill
  // the input from the operation's sample so the caller can just edit it.
  const opMethod = (operation?.method || "GET").toUpperCase();
  const isGet = opMethod === "GET" || opMethod === "HEAD";
  const sample = operation?.body ?? "";
  const initialInput = isGet ? (sample.includes("?") ? sample.split("?")[1]! : "") : sample;
  const [requestInput, setRequestInput] = useState(initialInput);

  // Only agents that can actually pay for this call.
  const eligible = useMemo(
    () =>
      agents.filter((a) => {
        const funded = Number(a.usdc) >= priceNum;
        const withinCap = a.policy ? priceNum <= Number(a.policy.maxPerCall) : true;
        return funded && withinCap;
      }),
    [agents, priceNum],
  );

  const filtered = useMemo(
    () => eligible.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase())),
    [eligible, query],
  );

  const [agentId, setAgentId] = useState("");
  const selectedId = agentId || eligible[0]?.agentId || "";

  function reset() {
    setResult(null);
    setQuery("");
    setRequestInput(initialInput);
  }

  function run() {
    setResult(null);
    startTransition(async () => {
      setResult(
        await runCapability({
          agentId: selectedId,
          slug,
          operation: operation?.slug,
          method: operation?.method,
          body: isGet ? undefined : requestInput,
          query: isGet ? requestInput : undefined,
        }),
      );
    });
  }

  return (
    <>
      {trigger === "compact" ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          className="transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <Play className="h-3.5 w-3.5" /> Run
        </Button>
      ) : (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="transition-transform duration-100 ease-out active:scale-[0.97]"
        >
          <Play className="h-4 w-4" /> Run with card
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md overflow-hidden">
          <DialogHeader className="min-w-0">
            <DialogTitle>{runLabel ? `Run ${runLabel}` : "Run with a card"}</DialogTitle>
            <DialogDescription>
              Your card pays ${runPrice} in USDC and returns the result. Nothing exceeds the caps
              you set.
            </DialogDescription>
          </DialogHeader>

          {result?.ok ? (
            <ResultView
              result={result}
              onAgain={() => setResult(null)}
              onClose={() => setOpen(false)}
            />
          ) : eligible.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No card can pay ${runPrice} for this call.
              <br />
              <a
                href="/agents"
                className="mt-1 inline-block font-medium text-foreground hover:underline"
              >
                Fund a card or raise its cap
              </a>
            </div>
          ) : (
            <div className="min-w-0 space-y-4">
              {/* Search — only when there are enough agents to warrant it. */}
              {eligible.length > 5 ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search cards…"
                    className="pl-9"
                  />
                </div>
              ) : null}

              {/* Agent list — compact + scrollable so it scales. */}
              <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
                {filtered.map((a) => {
                  const active = a.agentId === selectedId;
                  return (
                    <button
                      key={a.agentId}
                      type="button"
                      onClick={() => setAgentId(a.agentId)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-[border-color,background-color] duration-150 ${
                        active ? "border-foreground/30 bg-muted/50" : "hover:bg-muted/30"
                      }`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <CreditCard className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{a.name}</span>
                        {a.policy ? (
                          <span className="block text-xs tabular-nums text-muted-foreground">
                            max ${a.policy.maxPerCall}/call
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                        ${formatUsdc(a.usdc)}
                      </span>
                      {active ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
                    </button>
                  );
                })}
                {filtered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No match.</p>
                ) : null}
              </div>

              {/* Request input — query params for GET, a JSON body otherwise. */}
              {operation ? (
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    {isGet ? "Parameters" : "Request body"}
                  </span>
                  <textarea
                    value={requestInput}
                    onChange={(e) => setRequestInput(e.target.value)}
                    rows={isGet ? 2 : 3}
                    placeholder={isGet ? sample || "address=G…" : sample || '{ "key": "value" }'}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 font-mono text-xs"
                  />
                </label>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                <span className="text-muted-foreground">This call costs</span>
                <span className="font-semibold tabular-nums">${runPrice} USDC</span>
              </div>

              {result?.error ? (
                <p className="flex items-start gap-1.5 text-sm text-destructive">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {result.error}
                </p>
              ) : null}

              <Button
                className="w-full transition-transform duration-100 ease-out active:scale-[0.99]"
                onClick={run}
                disabled={pending || !selectedId}
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

function ResultView({
  result,
  onAgain,
  onClose,
}: {
  result: RunResult;
  onAgain: () => void;
  onClose: () => void;
}) {
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

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="flex-1 transition-transform duration-100 ease-out active:scale-[0.99]"
          onClick={onAgain}
        >
          Run again
        </Button>
        <Button
          className="flex-1 transition-transform duration-100 ease-out active:scale-[0.99]"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
      <a
        href="/payments"
        className="block text-center text-xs text-muted-foreground hover:underline"
      >
        See all calls in Payments
      </a>
    </div>
  );
}
