import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { networkPassphrase, type StellarNetwork } from "./config";

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
}): Promise<string> {
  const signer = Keypair.fromSecret(args.secret);
  const server = new Horizon.Server(args.horizonUrl);
  const usdc = new Asset("USDC", args.usdcIssuer);

  const account = await server.loadAccount(signer.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(args.network),
  });
  for (const leg of args.legs) {
    builder.addOperation(
      Operation.payment({ destination: leg.to, asset: usdc, amount: leg.amount }),
    );
  }
  const tx = builder.setTimeout(120).build();
  tx.sign(signer);
  return tx.toXDR();
}
