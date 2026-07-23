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
 * A Stellar asset in Horizon's wire shape: `{ asset_type: "native" }` for XLM, or
 * `{ asset_type: "credit_alphanum4" | "credit_alphanum12", asset_code, asset_issuer }`
 * for an issued asset. A swap intent carries its send/dest/path assets in exactly
 * this shape, so the route Horizon returned passes through to the signer untouched.
 */
export interface SwapAsset {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
}

/** Turn Horizon's asset shape into an SDK Asset. */
function toAsset(a: SwapAsset): Asset {
  if (a.asset_type === "native") return Asset.native();
  if (!a.asset_code || !a.asset_issuer) throw new Error("Malformed asset (missing code/issuer)");
  return new Asset(a.asset_code, a.asset_issuer);
}

/**
 * Build and sign a strict-send swap on the Stellar DEX: sell exactly `sendAmount`
 * of `send`, receive at least `destMin` of `dest`, routed through `path`. The swap
 * is self-to-self (the signer both sends and receives), so it converts one asset
 * to another inside the signer's own account. An optional USDC `fee` leg (Tael's
 * cut) settles in the SAME transaction, after the swap — atomic. Returns base64 XDR.
 *
 * `destMin` is the caller's slippage floor: if the market has moved so the route no
 * longer yields at least this much, the whole transaction fails and nothing trades
 * (the fee leg never runs either). The signer must be a funded account that trusts
 * both assets.
 */
export async function buildSignedSwap(args: {
  secret: string;
  network: StellarNetwork;
  horizonUrl: string;
  send: SwapAsset;
  sendAmount: string;
  dest: SwapAsset;
  destMin: string;
  path: SwapAsset[];
  /** Optional Tael fee, paid in USDC as a second op after the swap. */
  fee?: { to: string; amount: string; usdcIssuer: string };
  /** Optional Stellar text memo (max 28 bytes), e.g. {@link TAEL_MEMO}. */
  memo?: string;
}): Promise<string> {
  const signer = Keypair.fromSecret(args.secret);
  const server = new Horizon.Server(args.horizonUrl);

  const account = await server.loadAccount(signer.publicKey());
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase(args.network),
  });
  if (args.memo) builder.addMemo(Memo.text(args.memo));

  builder.addOperation(
    Operation.pathPaymentStrictSend({
      sendAsset: toAsset(args.send),
      sendAmount: args.sendAmount,
      destination: signer.publicKey(),
      destAsset: toAsset(args.dest),
      destMin: args.destMin,
      path: args.path.map(toAsset),
    }),
  );
  if (args.fee) {
    builder.addOperation(
      Operation.payment({
        destination: args.fee.to,
        asset: new Asset("USDC", args.fee.usdcIssuer),
        amount: args.fee.amount,
      }),
    );
  }

  const tx = builder.setTimeout(120).build();
  tx.sign(signer);
  return tx.toXDR();
}
