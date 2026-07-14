import "server-only";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const USDC_ISSUER = process.env.USDC_ISSUER ?? "";

interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
}

/**
 * Read a wallet's on-chain USDC balance from Horizon. The chain is the source of
 * truth (we don't trust the cached column for anything that matters). Returns
 * "0" for an unfunded account or on any error, plus whether it exists yet.
 */
export async function fetchUsdcBalance(
  address: string,
): Promise<{ usdc: string; funded: boolean }> {
  try {
    const res = await fetch(`${HORIZON_URL}/accounts/${address}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) return { usdc: "0", funded: false };
    if (!res.ok) return { usdc: "0", funded: false };
    const data = (await res.json()) as { balances?: HorizonBalance[] };
    const usdc = (data.balances ?? []).find(
      (b) => b.asset_code === "USDC" && (USDC_ISSUER === "" || b.asset_issuer === USDC_ISSUER),
    );
    return { usdc: usdc?.balance ?? "0", funded: true };
  } catch {
    return { usdc: "0", funded: false };
  }
}
