import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

let kit: StellarWalletsKit | null = null;

/**
 * Lazily create the Stellar Wallets Kit singleton. The kit is dynamically
 * imported (browser-only) so it never evaluates during SSR. Supports Freighter,
 * Albedo, xBull, and the other wallets the kit ships.
 */
export async function getWalletKit(): Promise<StellarWalletsKit> {
  if (kit) return kit;

  const {
    StellarWalletsKit: Kit,
    WalletNetwork,
    allowAllModules,
    FREIGHTER_ID,
  } = await import("@creit.tech/stellar-wallets-kit");

  const network =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet"
      ? WalletNetwork.PUBLIC
      : WalletNetwork.TESTNET;

  kit = new Kit({
    network,
    selectedWalletId: FREIGHTER_ID,
    modules: allowAllModules(),
  });

  return kit;
}
