import { describe, expect, it } from "vitest";
import { encodeReveal, extractReveals } from "./reveal-protocol";

describe("extractReveals", () => {
  it("returns plain text unchanged when there's no reveal marker", () => {
    const { visible, reveals } = extractReveals("just a normal reply");
    expect(visible).toBe("just a normal reply");
    expect(reveals).toEqual([]);
  });

  it("strips a complete reveal block out of the visible text and returns its payload", () => {
    const payload = { type: "api_key" as const, value: "tael_live_abc123", cardName: "Research" };
    const buffer = `Here's your key.${encodeReveal(payload)}All set.`;

    const { visible, reveals } = extractReveals(buffer);

    expect(visible).toBe("Here's your key.All set.");
    expect(reveals).toEqual([payload]);
  });

  it("handles a marker that hasn't fully arrived yet — no partial junk shown, nothing returned", () => {
    const payload = { type: "api_key" as const, value: "tael_live_abc123" };
    const full = encodeReveal(payload);
    const partial = `Here's your key.${full.slice(0, full.length - 5)}`; // END marker cut off

    const { visible, reveals } = extractReveals(partial);

    expect(visible).toBe("Here's your key.");
    expect(reveals).toEqual([]);
  });

  it("recovers once the rest of a previously-partial marker arrives (simulates the next chunk)", () => {
    const payload = { type: "api_key" as const, value: "tael_live_abc123" };
    const full = `Here's your key.${encodeReveal(payload)}All set.`;
    // First call sees only the first half of the stream so far.
    const firstHalf = full.slice(0, full.length - 8);
    const { reveals: firstPass } = extractReveals(firstHalf);
    expect(firstPass).toEqual([]);

    // Second call sees the full buffer (chunks accumulate; extractReveals is
    // always called against the whole buffer, never just the new chunk).
    const { visible, reveals } = extractReveals(full);
    expect(visible).toBe("Here's your key.All set.");
    expect(reveals).toEqual([payload]);
  });

  it("handles multiple reveal blocks in one buffer", () => {
    const a = { type: "api_key" as const, value: "tael_live_aaa" };
    const b = { type: "api_key" as const, value: "tael_live_bbb" };
    const buffer = `First:${encodeReveal(a)} Second:${encodeReveal(b)} done.`;

    const { visible, reveals } = extractReveals(buffer);

    expect(visible).toBe("First: Second: done.");
    expect(reveals).toEqual([a, b]);
  });

  it("drops a malformed payload instead of throwing", () => {
    const buffer = "before\u0000TAEL_REVEAL_START\u0000{not json}\u0000TAEL_REVEAL_END\u0000after";

    const { visible, reveals } = extractReveals(buffer);

    expect(visible).toBe("beforeafter");
    expect(reveals).toEqual([]);
  });
});
