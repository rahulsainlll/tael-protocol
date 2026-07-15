"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, TriangleAlert } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
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

export function CreateKeyButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  function reset() {
    setName("");
    setError(null);
    setCreatedKey(null);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createApiKey(name);
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
                  Name it so you can recognize it later. You&apos;ll see the key once, right after
                  it&apos;s created.
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
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <KeyRound className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium">
          {row.name}
          {revoked ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Revoked
            </span>
          ) : null}
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground">{row.prefix}…</p>
      </div>
      <p className="shrink-0 text-right text-xs text-muted-foreground">
        used {timeAgo(row.lastUsedAt)}
      </p>
      {!revoked ? (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setConfirmOpen(true)}
        >
          Revoke
        </Button>
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
    </div>
  );
}
