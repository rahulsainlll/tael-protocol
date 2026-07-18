"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, Wallet } from "lucide-react";
import { Button } from "@tael/ui";

function truncate(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function AccountMenu({ address }: { address: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground">
        <Wallet className="h-3.5 w-3.5" />
        {truncate(address)}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Disconnect wallet"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}