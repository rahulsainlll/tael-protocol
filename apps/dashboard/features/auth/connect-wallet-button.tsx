"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { Button } from "@tael/ui";
import { getWalletKit } from "./wallet-kit";

export function ConnectWalletButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(kit: StellarWalletsKit, address: string): Promise<void> {
    const challengeRes = await fetch(`/api/auth/challenge?address=${encodeURIComponent(address)}`);
    if (!challengeRes.ok) throw new Error("Could not start sign-in");
    const { message, challengeToken } = (await challengeRes.json()) as {
      message: string;
      challengeToken: string;
    };

    const { signedMessage } = await kit.signMessage(message, { address });

    const verifyRes = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ address, signature: signedMessage, challengeToken }),
    });
    if (!verifyRes.ok) {
      const data = (await verifyRes.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "Sign-in failed");
    }

    router.push("/");
    router.refresh();
  }

  async function connect() {
    setError(null);
    setLoading(true);
    try {
      const kit = await getWalletKit();
      let selected = false;
      await kit.openModal({
        onWalletSelected: async (option) => {
          selected = true;
          try {
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            await signIn(kit, address);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Sign-in failed");
            setLoading(false);
          }
        },
        onClosed: () => {
          if (!selected) setLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open wallet");
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
