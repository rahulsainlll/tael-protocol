import { describe, expect, it } from "vitest";
import { Money } from "./money";
import { ValidationError } from "./errors";

describe("Money", () => {
  it("parses and re-renders decimal strings", () => {
    expect(Money.parse("0.02").toDecimalString()).toBe("0.02");
    expect(Money.parse("19.29").toDecimalString()).toBe("19.29");
    expect(Money.parse("5").toDecimalString()).toBe("5");
  });

  it("stores amounts as atomic units with 7 decimals", () => {
    expect(Money.parse("0.02").atomic).toBe(200000n);
    expect(Money.parse("1").atomic).toBe(10000000n);
  });

  it("adds and subtracts without floating-point drift", () => {
    const spent = Money.parse("0.71");
    const budget = Money.parse("20");
    expect(budget.subtract(spent).toDecimalString()).toBe("19.29");
  });

  it("compares amounts", () => {
    expect(Money.parse("0.50").isGreaterThan(Money.parse("0.02"))).toBe(true);
    expect(Money.parse("0.02").isGreaterThan(Money.parse("0.50"))).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(() => Money.parse("abc")).toThrow(ValidationError);
  });

  it("serializes to a wire-friendly shape", () => {
    expect(Money.parse("0.02").toJSON()).toEqual({ amount: "0.02", currency: "USDC" });
  });
});
