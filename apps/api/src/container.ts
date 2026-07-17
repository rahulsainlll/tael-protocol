import {
  createMockVerifier,
  type PaymentNetwork,
  type PaymentVerifier,
  type SettlementReceipt,
} from "@tael/payments";
import { PaymentVerificationError } from "@tael/types";
import {
  createStellarSettlement,
  verifyTransactionPayments,
  type ExpectedPayment,
  type StellarNetwork,
} from "@tael/stellar";
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
import { DbApiKeyRepository } from "./modules/keys/key.repository";
import { KeyPaymentService } from "./modules/keys/key.service";
import { type RateLimiter, InMemoryRateLimiter } from "./modules/gateway/rate-limit";

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
  /** Authenticates Tael API keys and auto-pays from their linked Card. */
  keys: KeyPaymentService;
  verifier: PaymentVerifier;
  limiter: RateLimiter;
  /** Payment settings the gateway needs to build x402 challenges. */
  gateway: {
    issuer: string;
    network: PaymentNetwork;
    publicUrl: string;
    /** Marketplace fee recipient (Stellar address); undefined = no fee. */
    feeAddress?: string;
    /** Fee in basis points (100 = 1%). */
    feeBps: number;
  };
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
    async verify(payload, requirements): Promise<SettlementReceipt> {
      // Validate — offline — that the signed tx actually pays the required legs
      // (builder + any fee) in USDC, BEFORE submitting. Without this the gateway
      // would settle and serve any well-formed transaction (submit-and-trust).
      const expected: ExpectedPayment[] = [
        { to: requirements.payTo, minAmount: requirements.maxAmountRequired },
      ];
      if (requirements.fee) {
        expected.push({ to: requirements.fee.payTo, minAmount: requirements.fee.amount });
      }
      const check = verifyTransactionPayments(
        payload.payload.transaction,
        env.STELLAR_NETWORK,
        env.USDC_ISSUER,
        expected,
      );
      if (!check.ok) {
        throw new PaymentVerificationError(check.reason ?? "Payment does not satisfy requirements");
      }

      const receipt = await settlement.submitSignedTransaction(payload.payload.transaction);
      return {
        txHash: receipt.txHash,
        network,
        settledAt: new Date().toISOString(),
        payer: check.payer ?? receipt.payer,
        // The builder's net share and asset, so a reader (e.g. an underwriter) can
        // attribute this settlement's revenue straight from the receipt.
        amount: requirements.maxAmountRequired,
        asset: "USDC",
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

  // API-key auth: resolve a key to its Card and sign payments from that Card's
  // hot wallet, within the Card's caps. Needs the same Stellar settings the
  // verifier uses. Without a DB, key auth simply never authenticates.
  const keys = new KeyPaymentService(new DbApiKeyRepository(db), {
    network: env.STELLAR_NETWORK,
    x402Network: toPaymentNetwork(env.STELLAR_NETWORK),
    horizonUrl: env.STELLAR_HORIZON_URL,
    usdcIssuer: env.USDC_ISSUER,
  });

  // Real on-chain settlement in production; a mock keeps dev + tests hermetic.
  const verifier = isProd ? createStellarVerifier(env) : createMockVerifier();

  const limiter = new InMemoryRateLimiter(env.RATE_LIMIT_WINDOW_MS, env.RATE_LIMIT_MAX);

  return {
    wallets,
    payments,
    capabilities,
    keys,
    verifier,
    limiter,
    gateway: {
      issuer: env.USDC_ISSUER,
      network: toPaymentNetwork(env.STELLAR_NETWORK),
      publicUrl: env.API_PUBLIC_URL,
      feeAddress: env.TAEL_FEE_ADDRESS,
      feeBps: env.TAEL_FEE_BPS,
    },
  };
}
