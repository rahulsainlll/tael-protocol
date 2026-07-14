import { Bot } from "lucide-react";
import type { AgentWallet } from "./queries";

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

/** A single agent card: name, hot-wallet balance, funding address, spending cap. */
export function AgentsList({ agents }: { agents: AgentWallet[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {agents.map((a) => (
        <div key={a.agentId} className="rounded-xl border p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Bot className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-medium leading-tight">{a.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{truncate(a.address)}</p>
              </div>
            </div>
            {!a.funded ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                Unfunded
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums">
                ${Number(a.usdc).toFixed(2)}{" "}
                <span className="text-sm font-normal text-muted-foreground">USDC</span>
              </p>
            </div>
            {a.policy ? (
              <div className="text-right text-xs text-muted-foreground">
                <p>
                  max <span className="tabular-nums text-foreground">${a.policy.maxPerCall}</span>
                  /call
                </p>
                <p>
                  <span className="tabular-nums text-foreground">${a.policy.dailyLimit}</span>/day
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
