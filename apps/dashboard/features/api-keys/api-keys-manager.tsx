"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  KeyRound,
  MoreHorizontal,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@tael/ui";
import { CardSwatch } from "../agents/card-visual";
import type { CardPickerOption } from "../agents/queries";
import { createApiKey, revokeApiKey } from "./actions";
import type { ApiKeyRow } from "./queries";

function timeAgo(d: Date | null): string {
  if (!d) return "Never";
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  for (const [sec, label] of [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ] as const) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "Just now";
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

/** The linked Card, rendered as a compact single-line chip (swatch + name + cap). */
function CardChip({ card }: { card: NonNullable<ApiKeyRow["card"]> }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <CardSwatch address={card.address} />
      <span className="truncate text-sm font-medium">{card.name}</span>
      {card.policy ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          · ${card.policy.maxPerCall}/call
        </span>
      ) : null}
    </span>
  );
}

/** The "Funds from" cell: the linked card, or a quiet state when none is set. */
function FundsCell({ card, revoked }: { card: ApiKeyRow["card"]; revoked: boolean }) {
  if (card) return <CardChip card={card} />;
  if (revoked) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-amber-600">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Not linked
    </span>
  );
}

export function ApiKeysTable({ rows }: { rows: ApiKeyRow[] }) {
  const active = rows.filter((r) => r.revokedAt === null);
  const revoked = rows.filter((r) => r.revokedAt !== null);
  const [showRevoked, setShowRevoked] = useState(false);
  const visible = showRevoked ? [...active, ...revoked] : active;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 pl-4 text-xs uppercase tracking-wide">Name</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Key</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Funds from</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Last used</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <KeyRow key={row.id} row={row} />
            ))}
            {visible.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No active keys — all of yours are revoked.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      {revoked.length > 0 ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setShowRevoked((s) => !s)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {showRevoked ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {showRevoked ? "Hide" : "Show"} {revoked.length} revoked{" "}
            {revoked.length === 1 ? "key" : "keys"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function KeyRow({ row }: { row: ApiKeyRow }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
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
    <TableRow className={cn(revoked && "opacity-60")}>
      <TableCell className="py-3 pl-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </span>
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-medium">{row.name}</span>
            {revoked ? (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Revoked
              </span>
            ) : (
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                title="Active"
                aria-label="Active"
              />
            )}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-3 font-mono text-xs text-muted-foreground">{row.prefix}…</TableCell>
      <TableCell className="py-3">
        <FundsCell card={row.card} revoked={revoked} />
      </TableCell>
      <TableCell className="py-3 text-sm tabular-nums text-muted-foreground">
        {timeAgo(row.lastUsedAt)}
      </TableCell>
      <TableCell className="py-3 pr-4 text-right">
        {!revoked ? (
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${row.name}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[state=open]:bg-muted"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  setTimeout(() => setConfirmOpen(true), 0);
                }}
              >
                <Trash2 className="h-4 w-4" /> Revoke key
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

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
      </TableCell>
    </TableRow>
  );
}
