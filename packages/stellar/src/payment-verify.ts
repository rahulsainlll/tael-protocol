import { TransactionBuilder, type Operation, type Transaction } from "@stellar/stellar-sdk";
import { Money } from "@tael/types";
import { networkPassphrase, type StellarNetwork } from "./config";
import { USDC_CODE } from "./usdc";

/** One leg a transaction must satisfy: a USDC payment of at least `minAmount` to `to`. */
export interface ExpectedPayment {
  to: string;
  /** Minimum amount as a decimal USDC string, e.g. "0.02". */
  minAmount: string;
}

export interface TxPaymentCheck {
  ok: boolean;
  /** Source account of the transaction (the payer), when parseable. */
  payer: string | null;
  reason?: string;
}

/**
 * Verify — offline, straight from the signed XDR — that a transaction contains a
 * USDC payment satisfying **each** expected leg (destination + minimum amount).
 * Returns the payer (the transaction's source account).
 *
 * This is the security check that stops "submit-and-trust": a payer can't get a
 * paid result unless the tx actually pays the right amount, in USDC, to the
 * right recipient(s). Settlement (submission to Horizon) is a separate step.
 */
export function verifyTransactionPayments(
  signedXdr: string,
  network: StellarNetwork,
  usdcIssuer: string,
  expected: ExpectedPayment[],
): TxPaymentCheck {
  let tx: Transaction;
  try {
    const parsed = TransactionBuilder.fromXDR(signedXdr, networkPassphrase(network));
    // A fee-bump wraps an inner transaction; validate its ops + source.
    tx = "innerTransaction" in parsed ? parsed.innerTransaction : parsed;
  } catch {
    return { ok: false, payer: null, reason: "Malformed transaction XDR" };
  }

  const payer = tx.source;

  // Every USDC payment operation in the transaction, as { destination, amount }.
  const usdcPayments = tx.operations
    .filter((op): op is Operation.Payment => op.type === "payment")
    .filter(
      (op) =>
        !op.asset.isNative() &&
        op.asset.getCode() === USDC_CODE &&
        op.asset.getIssuer() === usdcIssuer,
    )
    .map((op) => ({ destination: op.destination, amount: Money.parse(op.amount) }));

  // Match each expected leg to a distinct payment op (so one op can't cover two).
  const used = new Set<number>();
  for (const leg of expected) {
    const min = Money.parse(leg.minAmount);
    const idx = usdcPayments.findIndex(
      (p, i) => !used.has(i) && p.destination === leg.to && !p.amount.subtract(min).isNegative(),
    );
    if (idx === -1) {
      return {
        ok: false,
        payer,
        reason: `Missing USDC payment of >= ${leg.minAmount} to ${leg.to}`,
      };
    }
    used.add(idx);
  }

  return { ok: true, payer };
}
