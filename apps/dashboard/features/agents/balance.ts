import "server-only";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const USDC_ISSUER = process.env.USDC_ISSUER ?? "";

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

export interface WalletBalance {
  /** On-chain USDC balance as a decimal string. */
  usdc: string;
  /** The account exists on-chain (has XLM). */
  funded: boolean;
  /** The account has a USDC trustline, so it can receive USDC. */
  ready: boolean;
}

/**
 * Read a wallet's on-chain state from Horizon. The chain is the source of truth
 * (we don't trust the cached column for anything that matters). Returns "0" and
 * not-ready for an unfunded account or on any error.
 */
export async function fetchUsdcBalance(address: string): Promise<WalletBalance> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return { usdc: "0", funded: false, ready: false };
    const data = (await res.json()) as { balances?: HorizonBalance[] };
    const usdc = (data.balances ?? []).find(
      (b) => b.asset_code === "USDC" && (USDC_ISSUER === "" || b.asset_issuer === USDC_ISSUER),
    );
    // A USDC balance entry (even 0) means the trustline exists → can receive USDC.
    return { usdc: usdc?.balance ?? "0", funded: true, ready: Boolean(usdc) };
  } catch {
    return { usdc: "0", funded: false, ready: false };
  }
}
