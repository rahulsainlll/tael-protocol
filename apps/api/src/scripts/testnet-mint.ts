/**
 * TESTNET: mint test-USDC to any address (e.g. a Card) from the test issuer.
 *
 * Requires ISSUER_SECRET — the secret for the account in USDC_ISSUER, printed by
 * `testnet:setup` (it said "Save these"). The destination must already hold a
 * USDC trustline (a Card does once it shows "Ready").
 *
 * Run: pnpm --filter @tael/api testnet:mint <destinationAddress> [amount]
 *   e.g. pnpm --filter @tael/api testnet:mint GDAK...KTE6I 25
 *
 * Testnet only — no mainnet, no real funds.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { networkPassphrase } from "@tael/stellar";

const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";

async function main(): Promise<void> {
  const [dest, amountArg] = process.argv.slice(2);
  const amount = amountArg ?? "25";
  if (!dest) {
    throw new Error("Usage: testnet:mint <destinationAddress> [amount]");
  }
  const issuerSecret = process.env.ISSUER_SECRET;
  if (!issuerSecret) {
    throw new Error("Set ISSUER_SECRET (the secret for USDC_ISSUER, printed by testnet:setup).");
  }

  const issuer = Keypair.fromSecret(issuerSecret);
  if (process.env.USDC_ISSUER && issuer.publicKey() !== process.env.USDC_ISSUER) {
    throw new Error(
      `ISSUER_SECRET is for ${issuer.publicKey()}, but USDC_ISSUER is ${process.env.USDC_ISSUER}. They must match.`,
    );
  }

  const usdc = new Asset("USDC", issuer.publicKey());
  const server = new Horizon.Server(HORIZON_URL);
  const account = await server.loadAccount(issuer.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase("testnet"),
  })
    .addOperation(Operation.payment({ destination: dest, asset: usdc, amount }))
    .setTimeout(60)
    .build();
  tx.sign(issuer);

  const res = await server.submitTransaction(tx);
  console.log(`Minted ${amount} test-USDC → ${dest}`);
  console.log(`  tx: ${res.hash}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
