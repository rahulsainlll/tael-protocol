/**
 * TESTNET: prove the Swap action on-chain, end to end — the analog of pay:testnet.
 *
 * It fetches a real swap intent from the capabilities service (the same JSON an
 * agent's card would get), signs it with @tael/stellar's `buildSignedSwap` (the
 * exact production signer — a self-to-self strict-send path payment), submits it,
 * and prints the tx hash. This exercises BOTH new pieces: the capability's intent
 * builder and the card-side signer.
 *
 * Prereq: an XLM/USDC market must exist, or the intent comes back 422. Seed one
 * first with `pnpm --filter @tael/api testnet:seed-market`.
 *
 * PAYER: set PAYER_SECRET (a funded testnet account with a USDC trustline), or leave
 * it unset and the script mints a fresh payer for you (friendbot XLM + trustline) —
 * enough to swap XLM -> USDC, since that direction only spends XLM.
 *
 * Usage:
 *   CAP_URL=http://localhost:3004 FROM=XLM TO=USDC AMOUNT=10 \
 *     pnpm --filter @tael/api swap:testnet
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
import {
  buildSignedSwap,
  createStellarSettlement,
  networkPassphrase,
  type SwapAsset,
  TAEL_MEMO,
} from "@tael/stellar";

const CAP_URL = process.env.CAP_URL ?? "http://localhost:3004";
const HORIZON_URL = process.env.STELLAR_HORIZON_URL ?? "https://horizon-testnet.stellar.org";
const USDC_ISSUER =
  process.env.USDC_ISSUER ?? "GBCDXWBEN7YMCBI3DPIWQ5QBGG2NE7G5REZLNJI2E57VVNVDQM7PF7RA";
const FRIENDBOT = "https://friendbot.stellar.org";
const server = new Horizon.Server(HORIZON_URL);

interface SwapIntent {
  tael_action: string;
  from: string;
  to: string;
  send: SwapAsset;
  sendAmount: string;
  dest: SwapAsset;
  destMin: string;
  estDest: string;
  path: SwapAsset[];
}

/** USDC + XLM balances for a quick before/after readout. */
async function balances(pub: string): Promise<{ xlm: string; usdc: string }> {
  const acct = await server.loadAccount(pub);
  const xlm = acct.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
  const usdc =
    acct.balances.find(
      (b) => "asset_code" in b && b.asset_code === "USDC" && b.asset_issuer === USDC_ISSUER,
    )?.balance ?? "0";
  return { xlm, usdc };
}

/** Create + fund a throwaway payer with an XLM balance and a USDC trustline. */
async function freshPayer(): Promise<Keypair> {
  const kp = Keypair.random();
  console.log(`No PAYER_SECRET — minting a fresh payer ${kp.publicKey().slice(0, 6)}…`);
  const res = await fetch(`${FRIENDBOT}?addr=${encodeURIComponent(kp.publicKey())}`);
  if (!res.ok) throw new Error(`friendbot failed: ${res.status}`);
  const acct = await server.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(acct, {
    fee: BASE_FEE,
    networkPassphrase: networkPassphrase("testnet"),
  })
    .addOperation(Operation.changeTrust({ asset: new Asset("USDC", USDC_ISSUER) }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  await server.submitTransaction(tx);
  return kp;
}

async function main(): Promise<void> {
  const from = (process.env.FROM ?? "XLM").toUpperCase();
  const to = (process.env.TO ?? "USDC").toUpperCase();
  const amount = process.env.AMOUNT ?? "10";

  const payer = process.env.PAYER_SECRET
    ? Keypair.fromSecret(process.env.PAYER_SECRET)
    : await freshPayer();

  // 1. Ask the capability for the swap intent (exactly what a card would receive).
  const url = `${CAP_URL}/stellar/swap?from=${from}&to=${to}&amount=${amount}`;
  console.log(`\nFetching intent: ${url}`);
  const res = await fetch(url);
  const intent = (await res.json()) as SwapIntent | { error: string };
  if (res.status !== 200 || !("tael_action" in intent)) {
    throw new Error(
      `Intent not available (${res.status}): ${"error" in intent ? intent.error : "unknown"}. ` +
        "Seed a market first: pnpm --filter @tael/api testnet:seed-market",
    );
  }
  console.log("Intent:", JSON.stringify(intent, null, 2));

  const before = await balances(payer.publicKey());
  console.log(`\nBefore  XLM ${before.xlm} · USDC ${before.usdc}`);

  // 2. Sign the swap with the production signer (no Tael fee in this proof).
  const xdr = await buildSignedSwap({
    secret: payer.secret(),
    network: "testnet",
    horizonUrl: HORIZON_URL,
    send: intent.send,
    sendAmount: intent.sendAmount,
    dest: intent.dest,
    destMin: intent.destMin,
    path: intent.path,
    memo: TAEL_MEMO,
  });

  // 3. Submit it.
  const receipt = await createStellarSettlement({
    network: "testnet",
    horizonUrl: HORIZON_URL,
    usdcIssuer: USDC_ISSUER,
  }).submitSignedTransaction(xdr);

  const after = await balances(payer.publicKey());
  console.log(`After   XLM ${after.xlm} · USDC ${after.usdc}`);
  console.log("\n──────────────────────────────────────────────");
  console.log(`SWAP SETTLED. ${amount} ${from} -> ${to} (min ${intent.destMin}).`);
  console.log(`  tx: ${receipt.txHash}`);
  console.log(`  https://stellar.expert/explorer/testnet/tx/${receipt.txHash}`);
  console.log("──────────────────────────────────────────────");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
