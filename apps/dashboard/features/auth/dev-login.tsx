"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@tael/ui";

/**
 * Testnet-only fallback: sign in with just a Stellar address (no signature).
 * Lets you into the dashboard while the wallet-signature flow is debugged.
 */
export function DevLogin() {
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/dev", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Login failed");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="G… (testnet address)"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
      />
      <Button
        variant="outline"
        className="w-full"
        onClick={() => void submit()}
        disabled={loading || address.trim().length === 0}
      >
        {loading ? "Signing in…" : "Continue with address (testnet)"}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
