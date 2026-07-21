"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, ChevronRight, CreditCard, Play, Sparkles, TriangleAlert } from "lucide-react";
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@tael/ui";
import { toast } from "sonner";
import { formatUsdc } from "../../lib/format";
import { runCapability, type RunResult } from "./run-capability";
import type { AgentOption } from "./queries";

/** One operation, as the explorer needs it (mirrors the marketplace detail page). */
export interface ExplorerOperation {
  name: string;
  opSlug: string;
  method: string;
  /** Formatted price for display, e.g. "0.001". */
  price: string;
  /** Raw decimal price, for the paid/free + affordability checks. */
  priceRaw: string;
  sampleRequest: string;
  sampleResponse: string;
}

/**
 * The operations of a capability as an expandable table: click a row to open its
 * parameters and sample, edit the request, and run it inline with a card — the
 * live result renders on the right, no modal. Replaces the old stacked-cards +
 * dialog. Motion follows the design rules: ease-out entrances, press feedback.
 */
export function OperationsExplorer({
  slug,
  agents,
  operations,
}: {
  slug: string;
  agents: AgentOption[];
  operations: ExplorerOperation[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(operations.length ? 0 : null);
  const [agentId, setAgentId] = useState(agents[0]?.agentId ?? "");
  const selected = agents.find((a) => a.agentId === agentId) ?? agents[0] ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Operations
        </h2>
        <CardPicker agents={agents} selected={selected} onSelect={setAgentId} />
      </div>

      <div className="overflow-hidden rounded-xl border">
        {/* Column header — table look without a semantic table (rows expand). */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Operation</span>
          <span className="text-right">Price</span>
          <span className="w-16" />
        </div>

        {operations.map((op, i) => (
          <OperationRow
            key={op.opSlug || i}
            slug={slug}
            op={op}
            agent={selected}
            open={openIdx === i}
            last={i === operations.length - 1}
            onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}

function CardPicker({
  agents,
  selected,
  onSelect,
}: {
  agents: AgentOption[];
  selected: AgentOption | null;
  onSelect: (id: string) => void;
}) {
  if (agents.length === 0) {
    return (
      <a href="/agents" className="text-sm font-medium text-foreground hover:underline">
        Add a card to run
      </a>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="transition-transform duration-100 ease-out active:scale-[0.98]"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span className="max-w-[10rem] truncate">{selected?.name ?? "Select a card"}</span>
          {selected ? (
            <span className="tabular-nums text-muted-foreground">${formatUsdc(selected.usdc)}</span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Run with card</DropdownMenuLabel>
        {agents.map((a) => (
          <DropdownMenuItem
            key={a.agentId}
            onSelect={() => onSelect(a.agentId)}
            className="flex items-center gap-2"
          >
            <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{a.name}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              ${formatUsdc(a.usdc)}
            </span>
            {a.agentId === selected?.agentId ? <Check className="h-4 w-4 shrink-0" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OperationRow({
  slug,
  op,
  agent,
  open,
  last,
  onToggle,
}: {
  slug: string;
  op: ExplorerOperation;
  agent: AgentOption | null;
  open: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  const method = (op.method || "GET").toUpperCase();
  const isGet = method === "GET" || method === "HEAD";
  const priceNum = Number(op.priceRaw);
  const paid = priceNum > 0;

  const [input, setInput] = useState(op.sampleRequest);
  const [result, setResult] = useState<RunResult | null>(null);
  const [pending, start] = useTransition();

  // Can the chosen card cover this call (balance + per-call cap)?
  const canPay = useMemo(() => {
    if (!agent) return false;
    if (!paid) return true;
    const funded = Number(agent.usdc) >= priceNum;
    const withinCap = agent.policy ? priceNum <= Number(agent.policy.maxPerCall) : true;
    return funded && withinCap;
  }, [agent, paid, priceNum]);

  function run() {
    if (!agent) {
      toast.error("Select a card to run this call.");
      return;
    }
    if (!canPay) {
      toast.error(`${agent.name} can't pay $${op.price} for this call.`);
      return;
    }
    setResult(null);
    start(async () => {
      const r = await runCapability({
        agentId: agent.agentId,
        slug,
        operation: op.opSlug,
        method,
        body: isGet ? undefined : input,
        query: isGet ? input : undefined,
      });
      setResult(r);
      if (r.ok) {
        toast.success(
          Number(r.paid) > 0 ? `Ran ${op.name} · paid $${r.paid} USDC` : `Ran ${op.name}`,
        );
      } else {
        toast.error(r.error ?? "The call failed.");
      }
    });
  }

  return (
    <div className={cn(!last && "border-b")}>
      {/* Row — click anywhere to expand. */}
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-muted/40"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              open && "rotate-90",
            )}
          />
          <span className="rounded border border-blue-500/20 bg-blue-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-600">
            {method}
          </span>
          <span className="truncate font-medium">{op.name}</span>
          <code className="hidden truncate font-mono text-xs text-muted-foreground sm:inline">
            /{slug}/{op.opSlug}
          </code>
        </span>

        <span className="text-right text-sm tabular-nums">
          {paid ? (
            <>
              <span className="font-semibold">${op.price}</span>
              <span className="text-xs font-normal text-muted-foreground"> USDC</span>
            </>
          ) : (
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              Free
            </span>
          )}
        </span>

        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (!open) onToggle();
            run();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              if (!open) onToggle();
              run();
            }
          }}
          className={cn(
            "inline-flex w-16 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-all duration-100 ease-out hover:bg-muted active:scale-[0.96]",
            pending && "pointer-events-none opacity-60",
          )}
        >
          {pending ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground/40 border-t-foreground" />
          ) : (
            <>
              <Play className="h-3 w-3" /> Run
            </>
          )}
        </span>
      </button>

      {/* Expanded detail — request on the left, live/sample response on the right. */}
      {open ? (
        <div className="grid gap-4 border-t bg-muted/20 p-4 duration-200 ease-out animate-in fade-in slide-in-from-top-1 md:grid-cols-2">
          {/* Request */}
          <div className="min-w-0 space-y-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {isGet ? "Parameters" : "Request body"}
              </span>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={isGet ? 2 : 4}
                spellCheck={false}
                placeholder={isGet ? "key=value&key2=value2" : '{ "key": "value" }'}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none transition-shadow focus:ring-2 focus:ring-ring/30"
              />
            </label>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {paid ? (
                  <>
                    Costs{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      ${op.price} USDC
                    </span>
                  </>
                ) : (
                  "Free to run"
                )}
              </span>
              <Button
                size="sm"
                onClick={run}
                disabled={pending || !agent || !canPay}
                className="transition-transform duration-100 ease-out active:scale-[0.97]"
              >
                {pending ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-background/40 border-t-background" />
                    {paid ? "Paying…" : "Running…"}
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5" /> {paid ? "Pay & run" : "Run"}
                  </>
                )}
              </Button>
            </div>
            {agent && !canPay ? (
              <p className="flex items-start gap-1.5 text-xs text-amber-600">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {agent.name} can&apos;t pay ${op.price} for this call. Pick another card or fund it.
              </p>
            ) : null}
          </div>

          {/* Response */}
          <div className="min-w-0 space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {result?.ok ? "Response" : result?.error ? "Error" : "Sample response"}
            </span>
            <ResultPanel result={result} sample={op.sampleResponse} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultPanel({ result, sample }: { result: RunResult | null; sample: string }) {
  if (result?.error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs leading-relaxed text-destructive duration-200 ease-out animate-in fade-in">
        <span className="flex items-start gap-1.5">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {result.error}
        </span>
        {result.body ? (
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[11px] opacity-80">
            {prettyJson(result.body)}
          </pre>
        ) : null}
      </div>
    );
  }

  const body = result?.ok ? result.body : sample;
  const live = Boolean(result?.ok);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-background",
        live && "duration-200 ease-out animate-in fade-in zoom-in-95",
      )}
    >
      {live ? (
        <div className="flex items-center gap-1.5 border-b bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-600">
          <Sparkles className="h-3.5 w-3.5" />
          {Number(result?.paid) > 0 ? `Paid $${result?.paid} USDC` : "Ran free"} · {result?.status}{" "}
          OK
        </div>
      ) : null}
      <pre className="max-h-72 min-w-0 overflow-auto p-3 font-mono text-[11px] leading-relaxed">
        <code className={cn(!live && "text-muted-foreground")}>
          {body ? prettyJson(body) : "Run to see the live result."}
        </code>
      </pre>
    </div>
  );
}

/** Pretty-print a JSON string; leave it as-is if it isn't JSON. */
function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}
