"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@tael/ui";
import { getWalletKit } from "./wallet-kit";

export function ConnectWalletButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setError(null);
    setLoading(true);
    // Track which step fails so the on-screen error is actionable.
    let step = "opening wallet";
    try {
      const kit = await getWalletKit();
      const { address } = await kit.authModal();

      step = "requesting challenge";
      const challengeRes = await fetch(
        `/api/auth/challenge?address=${encodeURIComponent(address)}`,
      );
      if (!challengeRes.ok) throw new Error(`challenge request failed (${challengeRes.status})`);
      const { message, challengeToken } = (await challengeRes.json()) as {
        message: string;
        challengeToken: string;
      };

      step = "signing message";
      const { signedMessage } = await kit.signMessage(message, { address });

      step = "verifying signature";
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, signature: signedMessage, challengeToken }),
      });
      if (!verifyRes.ok) {
        const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `verify failed (${verifyRes.status})`);
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error(`[tael auth] failed while ${step}:`, err);
      setError(`Failed while ${step}: ${detail}`);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-full" onClick={() => void connect()} disabled={loading}>
        {loading ? "Connecting…" : "Connect Stellar wallet"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
