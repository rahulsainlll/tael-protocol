import { describe, expect, it } from "vitest";
import { computeMeteredCost, readTokenUsage } from "./metered";

describe("metered billing math", () => {
  it("computes the exact pass-through cost for a known model", () => {
    // Haiku: $1/1M input, $5/1M output. 1,000,000 in + 1,000,000 out = $6.
    expect(
      computeMeteredCost("claude-haiku-4-5", { inputTokens: 1_000_000, outputTokens: 1_000_000 }),
    ).toBe("6.0000000");
    // A realistic small call: 1,204 in + 388 out.
    // 1204*1e-6 + 388*5e-6 = 0.001204 + 0.00194 = 0.003144
    expect(computeMeteredCost("claude-haiku-4-5", { inputTokens: 1_204, outputTokens: 388 })).toBe(
      "0.0031440",
    );
  });

  it("uses the right per-model rates", () => {
    // Opus: $5/$25 per 1M. 100k in + 10k out = 0.5 + 0.25 = 0.75.
    expect(
      computeMeteredCost("claude-opus-4-8", { inputTokens: 100_000, outputTokens: 10_000 }),
    ).toBe("0.7500000");
  });

  it("returns null (fail-safe) for an unknown model — never guesses a charge", () => {
    expect(
      computeMeteredCost("some-unknown-model", { inputTokens: 100, outputTokens: 100 }),
    ).toBeNull();
  });

  it("reads Anthropic-style usage", () => {
    const body = JSON.stringify({ content: [], usage: { input_tokens: 12, output_tokens: 7 } });
    expect(readTokenUsage(body)).toEqual({ inputTokens: 12, outputTokens: 7 });
  });

  it("reads OpenAI-style usage", () => {
    const body = JSON.stringify({ usage: { prompt_tokens: 30, completion_tokens: 9 } });
    expect(readTokenUsage(body)).toEqual({ inputTokens: 30, outputTokens: 9 });
  });

  it("returns null when usage is absent or unparseable", () => {
    expect(readTokenUsage(JSON.stringify({ foo: "bar" }))).toBeNull();
    expect(readTokenUsage("not json")).toBeNull();
  });
});
