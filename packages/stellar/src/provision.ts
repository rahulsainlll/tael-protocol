import { BASE_FEE, Horizon, Keypair, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { networkPassphrase, type StellarNetwork } from "./config";
import { usdcAsset } from "./usdc";

const FRIENDBOT_URL = "https://friendbot.stellar.org";

export interface ProvisionResult {
  ok: boolean;
  /** True if the account now holds a USDC trustline and can receive USDC. */
  ready: boolean;
  error?: string;
}

/**
 * Make a hot wallet able to *receive* USDC. A brand-new Stellar account can't
 * hold an asset until it (a) exists on-chain (needs XLM for the base reserve) and
 * (b) has a trustline to the asset. Both require the wallet's own signature, so
 * only the server (which holds the encrypted key) can do this.
 *
 * Testnet: funds XLM via friendbot, then adds the USDC trustline.
 * Mainnet: friendbot doesn't exist — the reserve XLM must come from a Tael
 * treasury (not built yet); this returns ok:false with a clear error there.
 */
export async function provisionHotWallet(args: {
  secret: string;
  network: StellarNetwork;
  horizonUrl: string;
  usdcIssuer: string;
}): Promise<ProvisionResult> {
  const keypair = Keypair.fromSecret(args.secret);
  const server = new Horizon.Server(args.horizonUrl);
  const passphrase = networkPassphrase(args.network);
  const usdc = usdcAsset(args.usdcIssuer);

  try {
    // 1. Ensure the account exists on-chain (needs XLM). Testnet-only via friendbot.
    let account = await loadAccount(server, keypair.publicKey());
    if (!account) {
      if (args.network !== "testnet") {
        return {
          ok: false,
          ready: false,
          error:
            "Wallet needs XLM before it can be provisioned (no treasury funding on mainnet yet).",
        };
      }
      const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(keypair.publicKey())}`);
      if (!res.ok) {
        return {
          ok: false,
          ready: false,
          error: `Could not fund the wallet (friendbot ${res.status}).`,
        };
      }
      account = await loadAccount(server, keypair.publicKey());
      if (!account) return { ok: false, ready: false, error: "Wallet funding did not settle." };
    }

    // 2. Add the USDC trustline if it isn't there yet.
    const hasTrustline = account.balances.some(
      (b) => "asset_code" in b && b.asset_code === "USDC" && b.asset_issuer === args.usdcIssuer,
    );
    if (hasTrustline) return { ok: true, ready: true };

    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(60)
      .build();
    tx.sign(keypair);
    await server.submitTransaction(tx);
    return { ok: true, ready: true };
  } catch (error) {
    return {
      ok: false,
      ready: false,
      error: error instanceof Error ? error.message : "Provisioning failed.",
    };
  }
}

async function loadAccount(
  server: Horizon.Server,
  publicKey: string,
): Promise<Horizon.AccountResponse | null> {
  try {
    return await server.loadAccount(publicKey);
  } catch {
    return null; // 404 = account not yet created on-chain
  }
}
