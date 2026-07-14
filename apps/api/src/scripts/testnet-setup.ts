/**
 * One-time TESTNET setup for proving real settlement end to end. Creates a
 * self-contained test-USDC world so we don't depend on external faucets:
 *
 *   - issuer  : mints the test USDC asset
 *   - payer   : the agent wallet that will pay for a capability call
 *   - builder : the capability's payTo (must hold a USDC trustline to be paid)
 *   - fee     : Tael's fee wallet (also needs a trustline)
 *
 * It funds each account with test XLM (friendbot), adds USDC trustlines, and
 * mints USDC to the payer. Prints every keypair + the exact env values to plug
 * into Render and the pay:testnet script.
 *
 * Run: pnpm --filter @tael/api testnet:setup
 * Nothing here touches mainnet or real funds.
 */
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Operation,
  TransactionBuilder,
  type Transaction,
} from "@stellar/stellar-sdk";
import { networkPassphrase } from "@tael/stellar";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const server = new Horizon.Server(HORIZON_URL);
const passphrase = networkPassphrase("testnet");

async function fund(pub: string, label: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(pub)}`);
  if (!res.ok) throw new Error(`friendbot failed for ${label}: ${res.status} ${await res.text()}`);
  console.log(`  funded ${label} (${pub.slice(0, 6)}…) with test XLM`);
}

async function submit(tx: Transaction, signers: Keypair[], label: string): Promise<void> {
  signers.forEach((s) => tx.sign(s));
  const res = await server.submitTransaction(tx);
  console.log(`  ${label} → ${res.hash}`);
}

async function main(): Promise<void> {
  console.log("Creating keypairs…");
  const issuer = Keypair.random();
  const payer = Keypair.random();
  const builder = Keypair.random();
  const fee = Keypair.random();

  const usdc = new Asset("USDC", issuer.publicKey());

  console.log("\nFunding accounts via friendbot…");
  await Promise.all([
    fund(issuer.publicKey(), "issuer"),
    fund(payer.publicKey(), "payer"),
    fund(builder.publicKey(), "builder"),
    fund(fee.publicKey(), "fee"),
  ]);

  // Trustlines: payer, builder, and fee must opt into the USDC asset.
  console.log("\nAdding USDC trustlines…");
  for (const [kp, label] of [
    [payer, "payer"],
    [builder, "builder"],
    [fee, "fee"],
  ] as const) {
    const account = await server.loadAccount(kp.publicKey());
    const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: passphrase })
      .addOperation(Operation.changeTrust({ asset: usdc }))
      .setTimeout(60)
      .build();
    await submit(tx, [kp], `trustline ${label}`);
  }

  // Mint USDC to the payer (issuer pays out).
  console.log("\nMinting test USDC to payer…");
  const issuerAccount = await server.loadAccount(issuer.publicKey());
  const mintTx = new TransactionBuilder(issuerAccount, {
    fee: BASE_FEE,
    networkPassphrase: passphrase,
  })
    .addOperation(Operation.payment({ destination: payer.publicKey(), asset: usdc, amount: "100" }))
    .setTimeout(60)
    .build();
  await submit(mintTx, [issuer], "mint 100 USDC → payer");

  console.log("\n──────────────────────────────────────────────");
  console.log("SETUP COMPLETE. Save these.\n");
  console.log("Set on Render (then redeploy):");
  console.log(`  USDC_ISSUER=${issuer.publicKey()}`);
  console.log(`  TAEL_FEE_ADDRESS=${fee.publicKey()}`);
  console.log("\nUse when publishing the test capability (its pay-to):");
  console.log(`  BUILDER_ADDRESS=${builder.publicKey()}`);
  console.log("\nUse for the pay:testnet script (the agent that pays):");
  console.log(`  PAYER_SECRET=${payer.secret()}`);
  console.log(`  PAYER_ADDRESS=${payer.publicKey()}`);
  console.log("\nSecrets (keep safe; testnet only):");
  console.log(`  ISSUER_SECRET=${issuer.secret()}`);
  console.log(`  BUILDER_SECRET=${builder.secret()}`);
  console.log(`  FEE_SECRET=${fee.secret()}`);
  console.log("──────────────────────────────────────────────");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
