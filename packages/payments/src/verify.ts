import { PaymentVerificationError } from "@tael/types";
import {
  paymentNetworkSchema,
  type PaymentNetwork,
  type PaymentPayload,
  type PaymentRequirements,
} from "./x402";

/** Proof that a payment settled on-chain. */
export interface SettlementReceipt {
  txHash: string;
  network: PaymentNetwork;
  settledAt: string;
}

/**
 * Port: verifies (and settles) a payment proof against stated requirements.
 * The Stellar implementation lives in `@tael/stellar`; tests and local dev use
 * {@link createMockVerifier}. Keeping this an interface is what stops the
 * payment protocol from depending on any specific chain.
 */
export interface PaymentVerifier {
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettlementReceipt>;
}

/**
 * Validate protocol-level invariants (scheme/network match) then delegate the
 * cryptographic + on-chain verification to the injected verifier.
 */
export async function verifyPayment(
  payload: PaymentPayload,
  requirements: PaymentRequirements,
  verifier: PaymentVerifier,
): Promise<SettlementReceipt> {
  if (payload.scheme !== requirements.scheme) {
    throw new PaymentVerificationError(
      `Scheme mismatch: got "${payload.scheme}", expected "${requirements.scheme}"`,
    );
  }
  if (payload.network !== requirements.network) {
    throw new PaymentVerificationError(
      `Network mismatch: got "${payload.network}", expected "${requirements.network}"`,
    );
  }
  return verifier.verify(payload, requirements);
}

/**
 * A verifier that accepts any well-formed payload and returns a fake receipt.
 * For tests and the local playground only — never wire this into production.
 */
export function createMockVerifier(): PaymentVerifier {
  return {
    verify(payload) {
      const network = paymentNetworkSchema.parse(payload.network);
      return Promise.resolve({
        txHash: `mock_${Buffer.from(payload.payload.transaction).toString("hex").slice(0, 32)}`,
        network,
        settledAt: new Date().toISOString(),
      });
    },
  };
}
