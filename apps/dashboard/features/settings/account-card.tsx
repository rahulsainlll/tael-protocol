"use client";

import { useState, useTransition } from "react";
import { Check, Copy } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@tael/ui";
import { updateDisplayName } from "./actions";

export function AccountCard({
  address,
  displayName,
}: {
  address: string;
  displayName: string | null;
}) {
  const [name, setName] = useState(displayName ?? "");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function copyAddress() {
    void navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function save() {
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res.ok) setSaved(true);
    });
  }

  const dirty = name.trim() !== (displayName ?? "");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Account</CardTitle>
          <Badge variant="secondary">Testnet</Badge>
        </div>
        <CardDescription>Your Stellar wallet is your identity.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Wallet address</span>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
              {address}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={copyAddress}
              aria-label="Copy wallet address"
            >
              {copied ? <Check className="text-emerald-600" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="displayName" className="text-xs font-medium text-muted-foreground">
            Display name
          </label>
          <Input
            id="displayName"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            placeholder="Add a display name (optional)"
            maxLength={60}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          {saved && !dirty ? (
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
