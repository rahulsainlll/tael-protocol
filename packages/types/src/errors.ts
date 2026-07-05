/**
 * The canonical error taxonomy for Tael. Every layer (SDK, payment, stellar,
 * api) throws these instead of bare `Error`s, so callers can branch on `code`
 * and HTTP adapters can map codes to status codes in one place.
 */
export type TaelErrorCode =
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "PAYMENT_REQUIRED"
  | "PAYMENT_VERIFICATION_FAILED"
  | "INSUFFICIENT_FUNDS"
  | "POLICY_VIOLATION"
  | "SETTLEMENT_FAILED"
  | "INTERNAL";

export class TaelError extends Error {
  readonly code: TaelErrorCode;

  constructor(code: TaelErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "TaelError";
    this.code = code;
  }
}

export class ValidationError extends TaelError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("VALIDATION", message, options);
    this.name = "ValidationError";
  }
}

export class PaymentRequiredError extends TaelError {
  constructor(message = "Payment required", options?: { cause?: unknown }) {
    super("PAYMENT_REQUIRED", message, options);
    this.name = "PaymentRequiredError";
  }
}

export class PaymentVerificationError extends TaelError {
  constructor(message = "Payment could not be verified", options?: { cause?: unknown }) {
    super("PAYMENT_VERIFICATION_FAILED", message, options);
    this.name = "PaymentVerificationError";
  }
}

export class InsufficientFundsError extends TaelError {
  constructor(message = "Insufficient funds", options?: { cause?: unknown }) {
    super("INSUFFICIENT_FUNDS", message, options);
    this.name = "InsufficientFundsError";
  }
}

export class PolicyViolationError extends TaelError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("POLICY_VIOLATION", message, options);
    this.name = "PolicyViolationError";
  }
}
