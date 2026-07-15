import "server-only";
import { agents, eq, wallets } from "@tael/database";
import { Money } from "@tael/types";
import { db } from "../../lib/db";
import { getSession } from "../../lib/auth";
import { getCurrentUser } from "../capabilities/current-user";
import { fetchUsdcBalance } from "../agents/balance";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const USDC_ISSUER = process.env.USDC_ISSUER ?? "";

export interface WalletOverview {
  /** The connected (owner) wallet. */
  address: string | null;
  usdc: string;
  xlm: string;
  /** Whether the connected wallet holds a USDC trustline. */
  hasUsdc: boolean;
  /** Combined USDC held across the user's agent hot wallets. */
  agentsUsdc: string;
  agentCount: number;
}

async function fetchXlm(address: string): Promise<{ xlm: string; hasUsdc: boolean }> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`, { cache: "no-store" });
    if (!res.ok) return { xlm: "0", hasUsdc: false };
    const data = (await res.json()) as {
      balances?: {
        asset_type: string;
        asset_code?: string;
        asset_issuer?: string;
        balance: string;
      }[];
    };
    const bals = data.balances ?? [];
    const xlm = bals.find((b) => b.asset_type === "native")?.balance ?? "0";
    const hasUsdc = bals.some(
      (b) => b.asset_code === "USDC" && (USDC_ISSUER === "" || b.asset_issuer === USDC_ISSUER),
    );
    return { xlm, hasUsdc };
  } catch {
    return { xlm: "0", hasUsdc: false };
  }
}

/** The connected wallet's live balances plus the combined balance of the user's agents. */
export async function getWalletOverview(): Promise<WalletOverview> {
  const session = await getSession();
  const user = await getCurrentUser();

  const address = session?.address ?? null;
  const [own, xlm] = address
    ? await Promise.all([fetchUsdcBalance(address), fetchXlm(address)])
    : [{ usdc: "0" }, { xlm: "0", hasUsdc: false }];

  let agentsUsdc = Money.zero();
  let agentCount = 0;
  if (user) {
    const rows = await db
      .select({ address: wallets.address })
      .from(agents)
      .innerJoin(wallets, eq(agents.walletId, wallets.id))
      .where(eq(agents.ownerId, user.id));
    agentCount = rows.length;
    const balances = await Promise.all(rows.map((r) => fetchUsdcBalance(r.address)));
    agentsUsdc = balances.reduce((sum, b) => sum.add(Money.parse(b.usdc)), Money.zero());
  }

  return {
    address,
    usdc: own.usdc,
    xlm: xlm.xlm,
    hasUsdc: xlm.hasUsdc,
    agentsUsdc: agentsUsdc.toDecimalString(),
    agentCount,
  };
}
