"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, TriangleAlert, Trash2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
} from "@tael/ui";
import { deleteAgent, provisionAgent, updateAgent } from "./actions";
import type { AgentWallet } from "./queries";

/** Fund / provision + edit + delete controls for a single agent. */
export function AgentManage({ agent }: { agent: AgentWallet }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const [name, setName] = useState(agent.name);
  const [maxPerCall, setMaxPerCall] = useState(agent.policy?.maxPerCall ?? "0.10");
  const [dailyLimit, setDailyLimit] = useState(agent.policy?.dailyLimit ?? "5.00");
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== agent.name ||
    maxPerCall !== (agent.policy?.maxPerCall ?? "") ||
    dailyLimit !== (agent.policy?.dailyLimit ?? "");

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(agent.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  function provision() {
    setError(null);
    startTransition(async () => {
      const res = await provisionAgent(agent.agentId);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Could not provision.");
    });
  }

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await updateAgent(agent.agentId, { name, maxPerCall, dailyLimit });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(res.error ?? "Could not save.");
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteAgent(agent.agentId);
      if (res.ok) router.push("/agents");
      else setError(res.error ?? "Could not delete.");
    });
  }

  return (
    <div className="space-y-8">
      {/* Fund / provision */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Funding
        </h2>
        {agent.ready ? (
          <>
            <p className="text-sm text-muted-foreground">
              Send <span className="font-medium text-foreground">USDC</span> on Stellar to this
              address, and your agents pay from it up to the caps below.
            </p>
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-700">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Send <span className="font-semibold">USDC</span>, not XLM. XLM only covers the
                account reserve and fees, so it won&apos;t add spendable balance.
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
              <span className="min-w-0 flex-1 break-all font-mono text-sm">{agent.address}</span>
              <button
                type="button"
                onClick={copyAddress}
                aria-label={copied ? "Copied" : "Copy address"}
                className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <p className="text-sm text-muted-foreground">
              This wallet isn&apos;t provisioned yet, so it can&apos;t receive USDC. Provision it to
              set up the on-chain account and USDC trustline.
            </p>
            <Button size="sm" onClick={provision} disabled={pending}>
              {pending ? "Provisioning…" : "Provision wallet"}
            </Button>
          </div>
        )}
      </section>

      {/* Edit */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Settings
        </h2>
        <div className="space-y-4 rounded-xl border p-5">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Max per call (USDC)">
              <Input value={maxPerCall} onChange={(e) => setMaxPerCall(e.target.value)} />
            </Field>
            <Field label="Daily limit (USDC)">
              <Input value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
            </Field>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={save} disabled={pending || !dirty || !name.trim()}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Danger */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Danger zone
        </h2>
        <div className="flex items-center justify-between rounded-xl border border-destructive/20 p-4">
          <div>
            <p className="text-sm font-medium">Delete this card</p>
            <p className="text-sm text-muted-foreground">
              Removes the card. Any on-chain funds stay recoverable.
            </p>
          </div>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </section>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) setConfirmText("");
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete card</DialogTitle>
            <DialogDescription>
              This removes <span className="font-medium text-foreground">{agent.name}</span>. Type{" "}
              <span className="font-mono font-semibold text-foreground">delete</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={remove}
              disabled={pending || confirmText.trim().toLowerCase() !== "delete"}
            >
              {pending ? "Deleting…" : "Delete card"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
