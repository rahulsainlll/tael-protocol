import {
  buildPaymentRequirements,
  decodePaymentHeader,
  PAYMENT_REQUEST_HEADER,
  PAYMENT_RESPONSE_HEADER,
  verifyPayment,
  X402_VERSION,
  type PaymentNetwork,
  type PaymentVerifier,
  type SettlementReceipt,
} from "@tael/payments";
import { PaymentVerificationError, type MoneyAmount, type StellarAddress } from "@tael/types";

/** Context passed to a paid handler once payment has settled. */
export interface TaelContext {
  request: Request;
  receipt: SettlementReceipt;
}

/** A paid handler. Runs only after a valid payment has been verified. */
export type TaelHandler = (context: TaelContext) => Response | Promise<Response>;

/** A framework-agnostic Fetch handler: `(Request) => Promise<Response>`. */
export type FetchHandler = (request: Request) => Promise<Response>;

export interface TaelOptions {
  /** Price per call as a decimal string, e.g. `"0.02"`. */
  price: MoneyAmount;
  /** Stellar address that receives settlement. */
  payTo: StellarAddress;
  /** USDC issuer on the target network. */
  issuer: StellarAddress;
  network: PaymentNetwork;
  /** Verifies + settles the payment (Stellar-backed in prod, mock in dev/tests). */
  verifier: PaymentVerifier;
  /** Human description shown in the 402 challenge. */
  description?: string;
  /**
   * Optional marketplace fee taken out of `price` and paid to `fee.payTo` in the
   * same transaction. Used by the Tael gateway; omit it for self-hosted routes
   * (the developer keeps 100%).
   */
  fee?: { payTo: StellarAddress; bps: number };
  handler: TaelHandler;
}

function jsonResponse(body: unknown, status: number, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function encodeReceipt(receipt: SettlementReceipt): string {
  return Buffer.from(JSON.stringify(receipt), "utf8").toString("base64");
}

/**
 * Wrap a handler so every call is gated by an x402 payment.
 *
 * - No / invalid `X-PAYMENT` header → responds `402 Payment Required` with the challenge.
 * - Valid payment → verifies, runs the handler, echoes an `X-PAYMENT-RESPONSE` receipt.
 */
export function tael(options: TaelOptions): FetchHandler {
  return async (request: Request): Promise<Response> => {
    const resource = new URL(request.url).pathname;
    const requirements = buildPaymentRequirements({
      price: options.price,
      payTo: options.payTo,
      issuer: options.issuer,
      network: options.network,
      resource,
      description: options.description,
      fee: options.fee,
    });

    const paymentRequired = (error?: string): Response =>
      jsonResponse({ x402Version: X402_VERSION, accepts: [requirements], error }, 402);

    const header = request.headers.get(PAYMENT_REQUEST_HEADER);
    if (!header) {
      return paymentRequired();
    }

    let receipt: SettlementReceipt;
    try {
      const payload = decodePaymentHeader(header);
      receipt = await verifyPayment(payload, requirements, options.verifier);
    } catch (error) {
      if (error instanceof PaymentVerificationError) {
        return paymentRequired(error.message);
      }
      throw error;
    }

    const response = await options.handler({ request, receipt });
    const headers = new Headers(response.headers);
    headers.set(PAYMENT_RESPONSE_HEADER, encodeReceipt(receipt));
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/** Defaults shared across every paid route in a service. */
export type TaelDefaults = Pick<TaelOptions, "payTo" | "issuer" | "network" | "verifier">;

/** A single paid route, using the shared defaults. */
export type TaelRoute = Pick<TaelOptions, "price" | "handler" | "description">;

/**
 * Bind service-wide defaults once so route definitions stay terse:
 *
 * ```ts
 * const paid = createTael({ payTo, issuer, network, verifier });
 * export default paid({ price: "0.02", handler: myApi });
 * ```
 */
export function createTael(defaults: TaelDefaults): (route: TaelRoute) => FetchHandler {
  return (route) => tael({ ...defaults, ...route });
}
