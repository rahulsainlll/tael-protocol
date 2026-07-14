import Link from "next/link";
import { Bot, Wallet as WalletIcon } from "lucide-react";
import { PageHeader } from "../../../components/page-header";
import { getWalletOverview } from "../../../features/wallet/queries";
import { WalletAddress } from "../../../features/wallet/wallet-address";

export const dynamic = "force-dynamic";

function usd(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

export default async function WalletPage() {
  const w = await getWalletOverview();

  return (
    <>
      <PageHeader
        title="Wallet"
        description="Your connected wallet and the funds across your agents."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Connected wallet */}
        <div className="rounded-xl border p-5">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <WalletIcon className="h-4 w-4" /> Connected wallet
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            ${usd(w.usdc)} <span className="text-base font-normal text-muted-foreground">USDC</span>
          </p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {usd(w.xlm)} XLM {w.hasUsdc ? "" : "· no USDC trustline yet"}
          </p>
          {w.address ? (
            <div className="mt-4">
              <WalletAddress address={w.address} />
            </div>
          ) : null}
        </div>

        {/* Agents */}
        <Link
          href="/agents"
          className="group flex flex-col rounded-xl border p-5 transition-[border-color,box-shadow,transform] duration-150 ease-out hover:border-foreground/20 hover:shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" /> Across your agents
          </div>
          <p className="mt-2 text-3xl font-semibold tabular-nums">
            ${usd(w.agentsUsdc)}{" "}
            <span className="text-base font-normal text-muted-foreground">USDC</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {w.agentCount} {w.agentCount === 1 ? "agent" : "agents"} · manage funding
          </p>
        </Link>
      </div>

      <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
        Tael is non-custodial: funds stay in your wallet and your agents&apos; wallets. Fund an
        agent from{" "}
        <Link href="/agents" className="font-medium text-foreground hover:underline">
          My Agents
        </Link>{" "}
        to let it pay per call. On testnet, add the USDC trustline in your wallet to receive
        earnings.
      </div>
    </>
  );
}
