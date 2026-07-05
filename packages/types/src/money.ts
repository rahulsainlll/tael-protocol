import { z } from "zod";
import { ValidationError } from "./errors";

/**
 * Money as a value object.
 *
 * USDC on Stellar is denominated to 7 decimal places ("stroops"). To avoid
 * floating-point rounding on financial amounts, every value is stored as an
 * integer number of atomic units (`bigint`) and only rendered to a decimal
 * string at the edges.
 */
export type CurrencyCode = "USDC";

const USDC_DECIMALS = 7;
const SCALE = 10n ** BigInt(USDC_DECIMALS);

/** A human-facing decimal amount, e.g. `"0.02"`. This is the wire format. */
export const moneyAmountSchema = z
  .string()
  .regex(/^-?\d+(\.\d+)?$/, 'Must be a decimal string, e.g. "0.02"');

export type MoneyAmount = z.infer<typeof moneyAmountSchema>;

export class Money {
  private constructor(
    readonly atomic: bigint,
    readonly currency: CurrencyCode,
  ) {}

  /** Construct from an integer number of atomic units. */
  static ofAtomic(atomic: bigint, currency: CurrencyCode = "USDC"): Money {
    return new Money(atomic, currency);
  }

  /** Parse a human decimal string such as `"0.02"`. */
  static parse(value: MoneyAmount | string, currency: CurrencyCode = "USDC"): Money {
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
    if (!match) {
      throw new ValidationError(`Invalid money amount: "${value}"`);
    }
    const sign = match[1] === "-" ? -1n : 1n;
    const whole = match[2] ?? "0";
    const fraction = (match[3] ?? "").padEnd(USDC_DECIMALS, "0").slice(0, USDC_DECIMALS);
    const atomic = sign * (BigInt(whole) * SCALE + BigInt(fraction || "0"));
    return new Money(atomic, currency);
  }

  static zero(currency: CurrencyCode = "USDC"): Money {
    return new Money(0n, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.atomic + other.atomic, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.atomic - other.atomic, this.currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.atomic > other.atomic;
  }

  isNegative(): boolean {
    return this.atomic < 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.atomic === other.atomic;
  }

  /** Render as a trimmed decimal string, e.g. `"0.02"`. */
  toDecimalString(): MoneyAmount {
    const negative = this.atomic < 0n;
    const abs = negative ? -this.atomic : this.atomic;
    const whole = abs / SCALE;
    const fraction = (abs % SCALE).toString().padStart(USDC_DECIMALS, "0").replace(/0+$/, "");
    const body = fraction.length > 0 ? `${whole}.${fraction}` : `${whole}`;
    return negative ? `-${body}` : body;
  }

  toJSON(): { amount: MoneyAmount; currency: CurrencyCode } {
    return { amount: this.toDecimalString(), currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}
