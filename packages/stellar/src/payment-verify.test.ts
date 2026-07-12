import {
  Account,
  Asset,
  BASE_FEE,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { networkPassphrase } from "./config";
import { usdcAsset } from "./usdc";
import { verifyTransactionPayments, type ExpectedPayment } from "./payment-verify";

const ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const BUILDER = Keypair.random().publicKey();
const TAEL = Keypair.random().publicKey();

/** Build + sign a testnet tx with the given payment ops, returning the XDR + payer. */
function buildTx(payer: Keypair, ops: { to: string; amount: string; asset?: Asset }[]): string {
  const account = new Account(payer.publicKey(), "0");
  const builder = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase("testnet"),
  });
  for (const op of ops) {
    builder.addOperation(
      Operation.payment({
        destination: op.to,
        asset: op.asset ?? usdcAsset(ISSUER),
        amount: op.amount,
      }),
    );
  }
  const tx = builder.setTimeout(60).build();
  tx.sign(payer);
  return tx.toXDR();
}

const builderLeg: ExpectedPayment = { to: BUILDER, minAmount: "0.0099" };
const feeLeg: ExpectedPayment = { to: TAEL, minAmount: "0.0001" };

describe("verifyTransactionPayments", () => {
  it("accepts a tx that pays the builder + fee, and returns the payer", () => {
    const payer = Keypair.random();
    const xdr = buildTx(payer, [
      { to: BUILDER, amount: "0.0099" },
      { to: TAEL, amount: "0.0001" },
    ]);

    const result = verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]);
    expect(result.ok).toBe(true);
    expect(result.payer).toBe(payer.publicKey());
  });

  it("accepts amounts above the minimum", () => {
    const xdr = buildTx(Keypair.random(), [
      { to: BUILDER, amount: "1.0" },
      { to: TAEL, amount: "0.5" },
    ]);
    expect(verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]).ok).toBe(true);
  });

  it("rejects an underpaid leg", () => {
    const xdr = buildTx(Keypair.random(), [
      { to: BUILDER, amount: "0.0001" }, // below 0.0099
      { to: TAEL, amount: "0.0001" },
    ]);
    const result = verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(BUILDER);
  });

  it("rejects a missing fee leg", () => {
    const xdr = buildTx(Keypair.random(), [{ to: BUILDER, amount: "0.0099" }]);
    expect(verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]).ok).toBe(false);
  });

  it("rejects payment to the wrong destination", () => {
    const xdr = buildTx(Keypair.random(), [
      { to: TAEL, amount: "0.0099" }, // builder share sent to the wrong address
      { to: TAEL, amount: "0.0001" },
    ]);
    expect(verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]).ok).toBe(false);
  });

  it("rejects the wrong asset (native XLM instead of USDC)", () => {
    const xdr = buildTx(Keypair.random(), [
      { to: BUILDER, amount: "0.0099", asset: Asset.native() },
      { to: TAEL, amount: "0.0001", asset: Asset.native() },
    ]);
    expect(verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]).ok).toBe(false);
  });

  it("rejects USDC from the wrong issuer", () => {
    const wrongIssuer = Keypair.random().publicKey();
    const xdr = buildTx(Keypair.random(), [
      { to: BUILDER, amount: "0.0099", asset: new Asset("USDC", wrongIssuer) },
      { to: TAEL, amount: "0.0001", asset: new Asset("USDC", wrongIssuer) },
    ]);
    expect(verifyTransactionPayments(xdr, "testnet", ISSUER, [builderLeg, feeLeg]).ok).toBe(false);
  });

  it("returns not-ok for malformed XDR", () => {
    const result = verifyTransactionPayments("not-a-real-xdr", "testnet", ISSUER, [builderLeg]);
    expect(result.ok).toBe(false);
    expect(result.payer).toBeNull();
  });
});
