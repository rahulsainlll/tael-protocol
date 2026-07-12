import { z } from "zod";
import {
  Money,
  moneyAmountSchema,
  stellarAddressSchema,
  PaymentVerificationError,
  type MoneyAmount,
  type StellarAddress,
} from "@tael/types";

/**
 * A minimal, typed model of the x402 payment protocol.
 *
 * Flow: a server responds `402 Payment Required` with a set of
 * {@link PaymentRequirements}. The client pays and retries with a
 * {@link PaymentPayload} in the `X-PAYMENT` header. Verification/settlement is
 * delegated to a `PaymentVerifier` (see `verify.ts`) so this package stays free
 * of chain-specific code.
 */
export const X402_VERSION = 1 as const;

/** Request header carrying the base64-encoded payment proof. */
export const PAYMENT_REQUEST_HEADER = "X-PAYMENT";
/** Response header carrying the settlement receipt. */
export const PAYMENT_RESPONSE_HEADER = "X-PAYMENT-RESPONSE";

/** x402 payment scheme. `exact` = pay exactly the required amount. */
export const paymentSchemeSchema = z.enum(["exact"]);
export type PaymentScheme = z.infer<typeof paymentSchemeSchema>;

export const paymentNetworkSchema = z.enum(["stellar-testnet", "stellar-mainnet"]);
export type PaymentNetwork = z.infer<typeof paymentNetworkSchema>;

export const assetSchema = z.object({
  code: z.literal("USDC"),
  issuer: stellarAddressSchema,
});

/**
 * An optional platform fee leg. When present, the payer must — atomically, in
 * the same transaction — pay `amount` to `payTo` (the marketplace) in addition
 * to the main payment. This keeps fee collection non-custodial: the fee lands
 * directly in the marketplace's wallet, never held by anyone.
 */
export const paymentFeeSchema = z.object({
  payTo: stellarAddressSchema,
  amount: moneyAmountSchema,
});
export type PaymentFee = z.infer<typeof paymentFeeSchema>;

export const paymentRequirementsSchema = z.object({
  scheme: paymentSchemeSchema,
  network: paymentNetworkSchema,
  /** The amount required for the main payee (the builder's net share). */
  maxAmountRequired: moneyAmountSchema,
  payTo: stellarAddressSchema,
  asset: assetSchema,
  /** Optional marketplace fee paid in the same transaction. */
  fee: paymentFeeSchema.optional(),
  /** Identifier of the resource being paid for (usually the request path). */
  resource: z.string().min(1),
  description: z.string().default(""),
  maxTimeoutSeconds: z.number().int().positive().default(60),
});
export type PaymentRequirements = z.infer<typeof paymentRequirementsSchema>;

/**
 * Split a total price into the payee's net share and a marketplace fee, using
 * integer (atomic) math so amounts are exact. `bps` is basis points — 100 = 1%.
 * The fee rounds down, so the payee never receives less than `total - ceil(fee)`.
 */
export function splitFee(
  total: MoneyAmount | Money,
  bps: number,
): { net: MoneyAmount; fee: MoneyAmount } {
  const money = total instanceof Money ? total : Money.parse(total);
  if (bps <= 0) return { net: money.toDecimalString(), fee: "0" };
  const fee = Money.ofAtomic((money.atomic * BigInt(bps)) / 10000n);
  return { net: money.subtract(fee).toDecimalString(), fee: fee.toDecimalString() };
}

/** The JSON body of a `402 Payment Required` response. */
export const paymentRequiredSchema = z.object({
  x402Version: z.literal(X402_VERSION),
  accepts: z.array(paymentRequirementsSchema).min(1),
  error: z.string().optional(),
});
export type PaymentRequired = z.infer<typeof paymentRequiredSchema>;

/** The proof a client sends in `X-PAYMENT` after paying. */
export const paymentPayloadSchema = z.object({
  x402Version: z.literal(X402_VERSION),
  scheme: paymentSchemeSchema,
  network: paymentNetworkSchema,
  /** Scheme-specific proof. For Stellar `exact`, a signed transaction envelope (XDR). */
  payload: z.object({
    transaction: z.string().min(1),
  }),
});
export type PaymentPayload = z.infer<typeof paymentPayloadSchema>;

export interface BuildRequirementsOptions {
  /** Total price the payer pays (before splitting out any fee). */
  price: MoneyAmount | Money;
  payTo: StellarAddress;
  network: PaymentNetwork;
  issuer: StellarAddress;
  resource: string;
  description?: string;
  /**
   * Optional marketplace fee taken out of `price`. When set, the payee receives
   * `price - fee` and `fee.payTo` receives the fee — atomically, same tx.
   */
  fee?: { payTo: StellarAddress; bps: number };
}

/** Build a single {@link PaymentRequirements} entry from a capability's price. */
export function buildPaymentRequirements(options: BuildRequirementsOptions): PaymentRequirements {
  const total = options.price instanceof Money ? options.price.toDecimalString() : options.price;

  let maxAmountRequired = total;
  let fee: PaymentFee | undefined;
  if (options.fee && options.fee.bps > 0) {
    const split = splitFee(total, options.fee.bps);
    maxAmountRequired = split.net;
    fee = { payTo: options.fee.payTo, amount: split.fee };
  }

  return paymentRequirementsSchema.parse({
    scheme: "exact",
    network: options.network,
    maxAmountRequired,
    payTo: options.payTo,
    asset: { code: "USDC", issuer: options.issuer },
    fee,
    resource: options.resource,
    description: options.description ?? "",
  });
}

/** Build the full `402 Payment Required` body offering one payment option. */
export function buildPaymentRequired(options: BuildRequirementsOptions): PaymentRequired {
  return {
    x402Version: X402_VERSION,
    accepts: [buildPaymentRequirements(options)],
  };
}

/** Encode a payment payload for the `X-PAYMENT` header (base64 JSON). */
export function encodePaymentPayload(payload: PaymentPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

/**
 * Decode and validate an incoming `X-PAYMENT` header value.
 * @throws {PaymentVerificationError} if the header is missing or malformed.
 */
export function decodePaymentHeader(headerValue: string | null | undefined): PaymentPayload {
  if (!headerValue) {
    throw new PaymentVerificationError("Missing X-PAYMENT header");
  }
  let json: unknown;
  try {
    json = JSON.parse(Buffer.from(headerValue, "base64").toString("utf8"));
  } catch (cause) {
    throw new PaymentVerificationError("X-PAYMENT header is not valid base64 JSON", { cause });
  }
  const result = paymentPayloadSchema.safeParse(json);
  if (!result.success) {
    throw new PaymentVerificationError("X-PAYMENT payload failed validation", {
      cause: result.error,
    });
  }
  return result.data;
}
