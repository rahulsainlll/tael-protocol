import Link from "next/link";
import type { AgentWallet } from "./queries";
import { CardVisual } from "./card-visual";

export function AgentsList({ agents }: { agents: AgentWallet[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {agents.map((a) => (
        <Link
          key={a.agentId}
          href={`/agents/${a.agentId}`}
          aria-label={a.name}
          className="block rounded-2xl outline-none transition-transform duration-150 ease-out hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]"
        >
          <CardVisual
            name={a.name}
            address={a.address}
            usdc={a.usdc}
            policy={a.policy}
            ready={a.ready}
          />
        </Link>
      ))}
    </div>
  );
}
