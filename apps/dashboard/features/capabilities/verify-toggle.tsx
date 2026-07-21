"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Button, cn } from "@tael/ui";
import { setCapabilityVerified } from "./actions";

/**
 * Admin-only control to grant or revoke the Verified badge on a capability.
 * Rendered on the marketplace detail page only when the viewer is a Tael admin.
 * `compact` renders a header-sized status pill + toggle; the default renders the
 * full dashed panel.
 */
export function VerifyToggle({
  id,
  verified,
  variant = "full",
}: {
  id: string;
  verified: boolean;
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setCapabilityVerified(id, !verified);
      if (res.ok) router.refresh();
      else setError(res.error ?? "Could not update.");
    });
  }

  // Header variant: a live status pill next to a single Verify/Unverify action.
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
            verified ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", verified ? "bg-emerald-500" : "bg-amber-500")}
          />
          {verified ? "Verified" : "Pending"}
        </span>
        <Button
          variant={verified ? "outline" : "default"}
          size="sm"
          onClick={toggle}
          disabled={pending}
          className="transition-transform duration-100 ease-out active:scale-[0.97]"
          title={error ?? undefined}
        >
          {verified ? null : <BadgeCheck className="h-4 w-4" />}
          {pending ? "…" : verified ? "Unverify" : "Verify"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2">
      <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-xs text-muted-foreground">
        Admin: {verified ? "this capability is verified." : "not verified yet."}
      </span>
      {verified ? (
        <Button variant="outline" size="sm" onClick={toggle} disabled={pending}>
          {pending ? "…" : "Unverify"}
        </Button>
      ) : (
        <Button size="sm" onClick={toggle} disabled={pending}>
          <BadgeCheck className="h-4 w-4" /> {pending ? "Verifying…" : "Verify"}
        </Button>
      )}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </div>
  );
}
