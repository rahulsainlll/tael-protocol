import { decryptSecret } from "@tael/database";
import { Money, type SpendingPolicy } from "@tael/types";
import { buildSignedPayment, TAEL_MEMO, type PaymentLeg, type StellarNetwork } from "@tael/stellar";
import { encodePaymentPayload, X402_VERSION, type PaymentNetwork } from "@tael/payments";

/** The Card an API key spends from, with the (server-only) signing secret. */
export interface AuthorizedCard {
  agentId: string;
  address: string;
  /** Encrypted hot-wallet secret — decrypted only here, never leaves the server. */
  secretEnc: string;
  policy: SpendingPolicy | null;
}

/** A resolved API key: its id, the owning publisher, and the linked Card. */
export interface AuthorizedKey {
  id: string;
  /** The user who owns this key — the publisher for capability writes. */
  ownerId: string;
  card: AuthorizedCard | null;
}

/**
 * Port: reads API keys and the payer's recent spend. Kept narrow so the gateway
 * depends on an abstraction (real Postgres in prod, a fake in tests).
 */
export interface KeyAuthorizer {
  /** Resolve a raw `tael_live_…` key to its Card, or null if unknown/revoked. */
  authorize(rawKey: string): Promise<AuthorizedKey | null>;
  /** Best-effort: mark the key as just used. */
  touch(keyId: string): Promise<void>;
  /** Total (amount + fee) this payer settled since `since` — for the daily cap. */
  spentSince(payer: string, since: Date): Promise<string>;
}

/** Stellar signing settings the service needs to build a payment from a Card. */
export interface KeySigningConfig {
  network: StellarNetwork;
  x402Network: PaymentNetwork;
  horizonUrl: string;
  usdcIssuer: string;
}

export type PayResult =
  { ok: true; xPayment: string } | { ok: false; status: number; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Turns a Tael API key into a paid request: authenticates the key, enforces the
 * linked Card's spending policy (per-call + rolling 24h), and signs an x402
 * payment from the Card's hot wallet. This is the server-side mirror of the
 * dashboard's `runCapability` — the caps are enforced BEFORE anything is signed,
 * so a key (or a runaway agent holding one) can never exceed what the owner set.
 */
export class KeyPaymentService {
  constructor(
    private readonly repo: KeyAuthorizer,
    private readonly config: KeySigningConfig,
  ) {}

  authorize(rawKey: string): Promise<AuthorizedKey | null> {
    return this.repo.authorize(rawKey);
  }

  touch(keyId: string): Promise<void> {
    return this.repo.touch(keyId);
  }

  async payForCall(input: {
    card: AuthorizedCard;
    /** Full price the Card pays (builder net + fee), decimal USDC. */
    total: string;
    /** Payment legs: builder net, plus the marketplace fee when set. */
    legs: PaymentLeg[];
  }): Promise<PayResult> {
    const { card, legs } = input;
    const total = Money.parse(input.total);

    if (card.policy) {
      const maxPerCall = Money.parse(card.policy.maxPerCall);
      if (total.isGreaterThan(maxPerCall)) {
        return {
          ok: false,
          status: 403,
          error: `Over this Card's per-call cap ($${total.toDecimalString()} > $${card.policy.maxPerCall}).`,
        };
      }
      const dailyLimit = Money.parse(card.policy.dailyLimit);
      const spent = Money.parse(
        await this.repo.spentSince(card.address, new Date(Date.now() - DAY_MS)),
      );
      if (spent.add(total).isGreaterThan(dailyLimit)) {
        return {
          ok: false,
          status: 403,
          error: `Would exceed this Card's daily limit of $${card.policy.dailyLimit}.`,
        };
      }
    }

    try {
      const xdr = await buildSignedPayment({
        secret: decryptSecret(card.secretEnc),
        network: this.config.network,
        horizonUrl: this.config.horizonUrl,
        usdcIssuer: this.config.usdcIssuer,
        legs,
        memo: TAEL_MEMO,
      });
      const xPayment = encodePaymentPayload({
        x402Version: X402_VERSION,
        scheme: "exact",
        network: this.config.x402Network,
        payload: { transaction: xdr },
      });
      return { ok: true, xPayment };
    } catch (error) {
      console.error("[gateway] card auto-pay signing failed:", error);
      return {
        ok: false,
        status: 402,
        error: "This Card can't pay for the call — check its USDC balance and trustline.",
      };
    }
  }
}
