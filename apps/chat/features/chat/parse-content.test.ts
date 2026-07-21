import { describe, expect, it } from "vitest";
import { parseContent } from "./parse-content";

describe("parseContent", () => {
  it("splits a tool line out from surrounding prose", () => {
    const blocks = parseContent(
      'Looking that up.\n✦ Searched capabilities for "weather" — 2 results.\nHere you go.',
    );
    expect(blocks).toEqual([
      { type: "p", text: "Looking that up." },
      { type: "tool", text: 'Searched capabilities for "weather" — 2 results.' },
      { type: "p", text: "Here you go." },
    ]);
  });

  it("renders a fenced code block as its own block", () => {
    const blocks = parseContent("Here's the price:\n```\n$0.01 / call\n```\nGood to know.");
    expect(blocks).toEqual([
      { type: "p", text: "Here's the price:" },
      { type: "code", text: "$0.01 / call" },
      { type: "p", text: "Good to know." },
    ]);
  });

  it("closes an unterminated fence rather than swallowing the rest of the message", () => {
    const blocks = parseContent("```\nstill streaming");
    expect(blocks).toEqual([{ type: "code", text: "still streaming" }]);
  });

  it("collapses consecutive non-empty lines into one paragraph", () => {
    const blocks = parseContent("line one\nline two");
    expect(blocks).toEqual([{ type: "p", text: "line one\nline two" }]);
  });
});
