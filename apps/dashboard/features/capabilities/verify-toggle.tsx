"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { Button } from "@tael/ui";
import { setCapabilityVerified } from "./actions";

/**
 * Admin-only control to grant or revoke the Verified badge on a capability.
 * Rendered on the marketplace detail page only when the viewer is a Tael admin.
 */
export function VerifyToggle({ id, verified }: { id: string; verified: boolean }) {
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
