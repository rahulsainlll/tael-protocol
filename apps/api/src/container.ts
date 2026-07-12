import {
  createMockVerifier,
  type PaymentNetwork,
  type PaymentVerifier,
  type SettlementReceipt,
} from "@tael/payments";
import { createStellarSettlement, type StellarNetwork } from "@tael/stellar";
import { getDatabase } from "@tael/database";
import { type Env } from "./env";
import { InMemoryWalletRepository } from "./modules/wallets/wallet.repository";
import { WalletService } from "./modules/wallets/wallet.service";
import {
  DbPaymentRepository,
  InMemoryPaymentRepository,
} from "./modules/payments/payment.repository";
import { PaymentService } from "./modules/payments/payment.service";
import {
  DbCapabilityRepository,
  type CapabilityRepository,
} from "./modules/capabilities/capability.repository";

/**
 * The composition root. This is the ONE place where concrete implementations are
 * wired together — repositories, services, and the Stellar→payment adapter. Every
 * other file depends on abstractions. Swapping in Postgres or a real verifier is
 * a change here and nowhere else.
 */
export interface Container {
  wallets: WalletService;
  payments: PaymentService;
  capabilities: CapabilityRepository;
  verifier: PaymentVerifier;
  /** Payment settings the gateway needs to build x402 challenges. */
  gateway: { issuer: string; network: PaymentNetwork; publicUrl: string };
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
      return {
        txHash: receipt.txHash,
        network,
        settledAt: new Date().toISOString(),
        payer: receipt.payer,
      };
    },
  };
}

export function createContainer(env: Env): Container {
  const isProd = env.NODE_ENV === "production";

  const wallets = new WalletService(new InMemoryWalletRepository());

  // Persist to Postgres when a DATABASE_URL is configured (prod / real dev);
  // fall back to the in-memory ledger so tests stay hermetic.
  const db = process.env.DATABASE_URL ? getDatabase() : undefined;
  const payments = new PaymentService(
    db ? new DbPaymentRepository(db) : new InMemoryPaymentRepository(),
  );
  const capabilities = new DbCapabilityRepository(db);

  // Real on-chain settlement in production; a mock keeps dev + tests hermetic.
  const verifier = isProd ? createStellarVerifier(env) : createMockVerifier();

  return {
    wallets,
    payments,
    capabilities,
    verifier,
    gateway: {
      issuer: env.USDC_ISSUER,
      network: toPaymentNetwork(env.STELLAR_NETWORK),
      publicUrl: env.API_PUBLIC_URL,
    },
  };
}
