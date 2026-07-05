type Kit = typeof import("@creit.tech/stellar-wallets-kit").StellarWalletsKit;

let initialized = false;

/**
 * Initialize the Stellar Wallets Kit (v2, static API) once and return the class.
 * Dynamically imported so it never evaluates during SSR (it uses browser globals).
 * `defaultModules()` (from the /modules/utils subpath) = the wallets that need no
 * extra config (Freighter, Albedo, xBull, Rabet, Lobstr, Hana, HOT, …).
 */
export async function getWalletKit(): Promise<Kit> {
  const [{ StellarWalletsKit, Networks }, { defaultModules }] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/utils"),
  ]);

  if (!initialized) {
    StellarWalletsKit.init({
      modules: defaultModules(),
      network:
        process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET,
    });
    initialized = true;
  }

  return StellarWalletsKit;
}
