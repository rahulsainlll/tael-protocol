import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { networkPassphrase, type StellarNetwork } from "./config";

/**
 * Marker attached to every Tael settlement as a Stellar text memo, so a payment
 * is attributable to Tael from on-chain data alone. Kept short (Stellar text
 * memos are capped at 28 bytes) and versioned by convention if it ever changes.
 */
export const TAEL_MEMO = "tael";

/** One USDC payment leg the transaction must include. */
export interface PaymentLeg {
  to: string;
  amount: string;
}

/**
 * Build and sign a Stellar transaction that pays the given USDC legs (e.g. the
 * builder's share + the marketplace fee) from `secret`. Returns the base64 XDR,
 * ready to drop into an x402 `X-PAYMENT` proof.
 *
 * The tx is fetched-and-signed against the current account sequence, so the
 * signer must be a funded account with a USDC trustline.
 */
export async function buildSignedPayment(args: {
  secret: string;
  network: StellarNetwork;
  horizonUrl: string;
  usdcIssuer: string;
  legs: PaymentLeg[];
  /** Optional Stellar text memo (max 28 bytes), e.g. {@link TAEL_MEMO}. */
  memo?: string;
}): Promise<string> {
  const signer = Keypair.fromSecret(args.secret);
  const server = new Horizon.Server(args.horizonUrl);
  const usdc = new Asset("USDC", args.usdcIssuer);

  const account = await server.loadAccount(signer.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(args.network),
  });
  if (args.memo) {
    builder.addMemo(Memo.text(args.memo));
  }
  for (const leg of args.legs) {
    builder.addOperation(
      Operation.payment({ destination: leg.to, asset: usdc, amount: leg.amount }),
    );
  }
  const tx = builder.setTimeout(120).build();
  tx.sign(signer);
  return tx.toXDR();
}
