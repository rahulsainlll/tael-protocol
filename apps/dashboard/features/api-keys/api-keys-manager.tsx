"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, CreditCard, KeyRound, TriangleAlert } from "lucide-react";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
import { CardVisual } from "../agents/card-visual";
import type { CardPickerOption } from "../agents/queries";
import { createApiKey, revokeApiKey } from "./actions";
import type { ApiKeyRow } from "./queries";

function timeAgo(d: Date | null): string {
  if (!d) return "never";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  for (const [sec, label] of [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ] as const) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "just now";
}

function cardLimits(policy: { maxPerCall: string; dailyLimit: string } | null): string {
  return policy ? `max $${policy.maxPerCall}/call · $${policy.dailyLimit}/day` : "no limits set";
}

export function CreateKeyButton({ cards }: { cards: CardPickerOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [cardId, setCardId] = useState<string>(cards[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  function reset() {
    setName("");
    setCardId(cards[0]?.id ?? "");
    setError(null);
    setCreatedKey(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createApiKey(name, cardId || null);
      if (res.ok && res.key) {
        setCreatedKey(res.key);
        router.refresh();
      } else {
        setError(res.error ?? "Could not create the key.");
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Create key</Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent className="max-w-md overflow-hidden">
          {createdKey ? (
            <KeyRevealed keyValue={createdKey} onDone={() => setOpen(false)} />
          ) : (
            <>
              <DialogHeader className="min-w-0">
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>
                  Name it, choose the Card it spends from, and you&apos;ll see the key once.
                </DialogDescription>
              </DialogHeader>
              <div className="min-w-0 space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium">Name</span>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Production server"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && name.trim()) submit();
                    }}
                  />
                </label>

                <div className="space-y-1.5">
                  <span className="text-sm font-medium">Funds from</span>
                  <p className="text-xs text-muted-foreground">
                    Which Card pays for calls made with this key.
                  </p>
                  {cards.length === 0 ? (
                    <p className="rounded-lg border border-dashed px-3 py-2.5 text-xs text-muted-foreground">
                      No Cards yet.{" "}
                      <Link href="/agents" className="font-medium text-foreground underline">
                        Create a Card
                      </Link>{" "}
                      to fund this key. You can also make the key now and link one later.
                    </p>
                  ) : (
                    <div className="relative">
                      <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={cardId}
                        onChange={(e) => setCardId(e.target.value)}
                        className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm"
                      >
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} — {cardLimits(c.policy)}
                          </option>
                        ))}
                        <option value="">No Card (link one later)</option>
                      </select>
                    </div>
                  )}
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                <Button
                  className="w-full transition-transform duration-100 ease-out active:scale-[0.99]"
                  onClick={submit}
                  disabled={pending || !name.trim()}
                >
                  {pending ? "Creating…" : "Create key"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function KeyRevealed({ keyValue, onDone }: { keyValue: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  return (
    <div className="min-w-0 space-y-4 duration-200 ease-out animate-in fade-in zoom-in-95">
      <DialogHeader className="min-w-0">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10">
          <KeyRound className="h-5 w-5 text-emerald-600" />
        </div>
        <DialogTitle className="pt-2">Key created</DialogTitle>
        <DialogDescription>
          Copy it now. For your security, we don&apos;t store it and can&apos;t show it again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
        <span className="min-w-0 flex-1 truncate font-mono text-sm">{keyValue}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy key"}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-[color,transform] duration-100 ease-out hover:text-foreground active:scale-95"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      <Button
        className="w-full transition-transform duration-100 ease-out active:scale-[0.99]"
        onClick={onDone}
      >
        Done
      </Button>
    </div>
  );
}

export function ApiKeyItem({ row }: { row: ApiKeyRow }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const revoked = row.revokedAt !== null;

  function revoke() {
    setError(null);
    startTransition(async () => {
      const res = await revokeApiKey(row.id);
      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      } else {
        setError(res.error ?? "Could not revoke.");
      }
    });
  }

  return (
    <div className={cn("space-y-3 rounded-xl border p-4", revoked && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{row.name}</span>
              {revoked ? (
                <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Revoked
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" /> Active
                </span>
              )}
            </p>
            <p className="truncate font-mono text-xs text-muted-foreground">{row.prefix}…</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            used {timeAgo(row.lastUsedAt)}
          </span>
          {!revoked ? (
            <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)}>
              Revoke
            </Button>
          ) : null}
        </div>
      </div>

      {row.card ? (
        <div className="flex items-center gap-3.5 rounded-lg border bg-muted/20 p-3">
          <CardVisual
            name={row.card.name}
            address={row.card.address}
            policy={row.card.policy}
            compact
          />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Funds from
            </p>
            <p className="truncate text-sm font-medium">{row.card.name}</p>
            <p className="truncate text-xs tabular-nums text-muted-foreground">
              {cardLimits(row.card.policy)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
          <CreditCard className="h-4 w-4 shrink-0 text-amber-500" />
          No Card linked — calls made with this key can&apos;t be billed yet.
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
              <TriangleAlert className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle className="pt-2">Revoke key</DialogTitle>
            <DialogDescription>
              Revoking <span className="font-medium text-foreground">{row.name}</span> immediately
              stops it from working. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button variant="destructive" className="flex-1" onClick={revoke} disabled={pending}>
              {pending ? "Revoking…" : "Revoke key"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
