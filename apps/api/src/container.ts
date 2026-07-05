import {
  createMockVerifier,
  type PaymentNetwork,
  type PaymentVerifier,
  type SettlementReceipt,
} from "@tael/payments";
import { createStellarSettlement, type StellarNetwork } from "@tael/stellar";
import { type Env } from "./env";
import { InMemoryWalletRepository } from "./modules/wallets/wallet.repository";
import { WalletService } from "./modules/wallets/wallet.service";
import { InMemoryPaymentRepository } from "./modules/payments/payment.repository";
import { PaymentService } from "./modules/payments/payment.service";

/**
 * The composition root. This is the ONE place where concrete implementations are
 * wired together — repositories, services, and the Stellar→payment adapter. Every
 * other file depends on abstractions. Swapping in Postgres or a real verifier is
 * a change here and nowhere else.
 */
export interface Container {
  wallets: WalletService;
  payments: PaymentService;
  verifier: PaymentVerifier;
}

function toPaymentNetwork(network: StellarNetwork): PaymentNetwork {
  return network === "mainnet" ? "stellar-mainnet" : "stellar-testnet";
}

/** Adapt @tael/stellar settlement into @tael/payments's PaymentVerifier port. */
function createStellarVerifier(env: Env): PaymentVerifier {
  const settlement = createStellarSettlement({
    network: env.STELLAR_NETWORK,
    horizonUrl: env.STELLAR_HORIZON_URL,
    usdcIssuer: env.USDC_ISSUER,
  });
  const network = toPaymentNetwork(env.STELLAR_NETWORK);

  return {
    async verify(payload): Promise<SettlementReceipt> {
      const receipt = await settlement.submitSignedTransaction(payload.payload.transaction);
      return { txHash: receipt.txHash, network, settledAt: new Date().toISOString() };
    },
  };
}

export function createContainer(env: Env): Container {
  const wallets = new WalletService(new InMemoryWalletRepository());
  const payments = new PaymentService(new InMemoryPaymentRepository());

  // Real on-chain settlement in production; a mock keeps dev + tests hermetic.
  const verifier =
    env.NODE_ENV === "production" ? createStellarVerifier(env) : createMockVerifier();

  return { wallets, payments, verifier };
}
