import { Horizon, TransactionBuilder } from "@stellar/stellar-sdk";
import { TaelError } from "@tael/types";
import { networkPassphrase, type StellarConfig, type StellarNetwork } from "./config";

/** Receipt returned after a signed transaction is accepted by the network. */
export interface StellarTxReceipt {
  txHash: string;
  network: StellarNetwork;
}

/**
 * Thin wrapper over the Stellar SDK for the one operation Tael settlement needs
 * today: submit a client-signed transaction envelope (XDR) that pays USDC.
 *
 * This package deliberately knows nothing about x402 — the api composes it into
 * a `PaymentVerifier` (see apps/api). When settlement moves on-chain, a Soroban
 * implementation lives behind this same class (see contracts/).
 */
export class StellarSettlement {
  private readonly server: Horizon.Server;

  constructor(private readonly config: StellarConfig) {
    this.server = new Horizon.Server(config.horizonUrl);
  }

  /** Submit a signed transaction envelope (base64 XDR) to the network. */
  async submitSignedTransaction(signedXdr: string): Promise<StellarTxReceipt> {
    try {
      const transaction = TransactionBuilder.fromXDR(
        signedXdr,
        networkPassphrase(this.config.network),
      );
      const result = await this.server.submitTransaction(transaction);
      return { txHash: result.hash, network: this.config.network };
    } catch (cause) {
      throw new TaelError("SETTLEMENT_FAILED", "Failed to submit transaction to Stellar", {
        cause,
      });
    }
  }
}

export function createStellarSettlement(config: StellarConfig): StellarSettlement {
  return new StellarSettlement(config);
}
