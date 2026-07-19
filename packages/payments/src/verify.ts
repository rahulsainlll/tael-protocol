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
  /** The account that paid — the source of the settled transaction. */
  payer: string;
  /** Amount received by the payee (the builder's net share), as a decimal string. */
  amount: string;
  /** Settled asset code, so a reader can attribute the revenue on-chain (USDC today). */
  asset: string;
}

/**
 * A payment that has been validated (its signed tx pays the required legs) but
 * NOT yet submitted on-chain. Carries the payer so a resource can be served
 * before settlement, and the payload/requirements needed to settle afterwards.
 */
export interface ValidatedPayment {
  /** The account that will pay — the source of the (not-yet-submitted) tx. */
  payer: string;
  payload: PaymentPayload;
  requirements: PaymentRequirements;
}

/**
 * Port: verifies (and settles) a payment proof against stated requirements.
 * The Stellar implementation lives in `@tael/stellar`; tests and local dev use
 * {@link createMockVerifier}. Keeping this an interface is what stops the
 * payment protocol from depending on any specific chain.
 *
 * `validate` + `settle` let a caller serve the resource BETWEEN the two, so a
 * failed resource is never charged (serve-then-settle). `verify` is the combined
 * validate-then-settle, kept for callers that settle up front (the `tael()` SDK).
 */
export interface PaymentVerifier {
  verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<SettlementReceipt>;
  /** Check the signed tx satisfies the requirements, WITHOUT submitting it. */
  validate(payload: PaymentPayload, requirements: PaymentRequirements): Promise<ValidatedPayment>;
  /** Submit a previously-validated payment on-chain and return the receipt. */
  settle(validated: ValidatedPayment): Promise<SettlementReceipt>;
}

/** Protocol-level checks (scheme + network) shared by validate and verify. */
function assertProtocol(payload: PaymentPayload, requirements: PaymentRequirements): void {
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
}

/**
 * Validate protocol-level invariants (scheme/network match) then delegate the
 * cryptographic + on-chain verification to the injected verifier. Verifies AND
 * settles in one step — use {@link validatePayment} + {@link settlePayment} when
 * you need to serve a resource before charging for it.
 */
export async function verifyPayment(
  payload: PaymentPayload,
  requirements: PaymentRequirements,
  verifier: PaymentVerifier,
): Promise<SettlementReceipt> {
  assertProtocol(payload, requirements);
  return verifier.verify(payload, requirements);
}

/** Validate a payment (no on-chain submission) after the protocol checks. */
export async function validatePayment(
  payload: PaymentPayload,
  requirements: PaymentRequirements,
  verifier: PaymentVerifier,
): Promise<ValidatedPayment> {
  assertProtocol(payload, requirements);
  return verifier.validate(payload, requirements);
}

/** Settle a previously-validated payment on-chain. */
export function settlePayment(
  validated: ValidatedPayment,
  verifier: PaymentVerifier,
): Promise<SettlementReceipt> {
  return verifier.settle(validated);
}

/**
 * A verifier that accepts any well-formed payload and returns a fake receipt.
 * For tests and the local playground only — never wire this into production.
 */
export function createMockVerifier(): PaymentVerifier {
  const mockPayer = (payload: PaymentPayload): string =>
    `mock_payer_${Buffer.from(payload.payload.transaction).toString("hex").slice(0, 16)}`;

  const receiptFor = (validated: ValidatedPayment): SettlementReceipt => {
    const network = paymentNetworkSchema.parse(validated.payload.network);
    const hex = Buffer.from(validated.payload.payload.transaction).toString("hex");
    return {
      txHash: `mock_${hex.slice(0, 32)}`,
      network,
      settledAt: new Date().toISOString(),
      payer: validated.payer,
      amount: validated.requirements.maxAmountRequired,
      asset: "USDC",
    };
  };

  return {
    validate(payload, requirements) {
      return Promise.resolve({ payer: mockPayer(payload), payload, requirements });
    },
    settle(validated) {
      return Promise.resolve(receiptFor(validated));
    },
    verify(payload, requirements) {
      return Promise.resolve(receiptFor({ payer: mockPayer(payload), payload, requirements }));
    },
  };
}
