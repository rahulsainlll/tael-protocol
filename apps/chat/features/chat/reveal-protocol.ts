/**
 * Out-of-band delivery for values the client needs but the model must never
 * see and the DB must never store — currently just a freshly created API
 * key's raw value.
 *
 * Same idea as the `x-thread-id` response header (hand the client something
 * without routing it through the model), but a header only works for values
 * known before the stream starts. A key's raw value is only known mid-stream,
 * after `create_api_key` executes — so instead this wraps the payload in a
 * sentinel and writes it directly into the same byte stream already carrying
 * the assistant's text, at the point the tool executes.
 *
 * NUL (`\u0000`) can't appear in normal chat text or in the JSON payload
 * we wrap, so it's a safe, trivially-stripped delimiter — no escaping needed.
 *
 * Critically: this text is written to the live `enqueue()` stream but
 * deliberately kept OUT of the route's `transcript` accumulator (what gets
 * persisted to `chat_messages` and replayed to the model as history). The
 * model's tool_result for create_api_key gets a redacted echo (prefix only,
 * see execute.ts) — it never sees the raw value and can't repeat it back
 * into its own (persisted) reply.
 */
const REVEAL_START = "\u0000TAEL_REVEAL_START\u0000";
const REVEAL_END = "\u0000TAEL_REVEAL_END\u0000";

export interface RevealPayload {
  type: "api_key";
  value: string;
  /** Card the key was linked to, if any — shown alongside the reveal card. */
  cardName?: string;
}

/** Server side: wrap a payload for injection into the live stream. */
export function encodeReveal(payload: RevealPayload): string {
  return `${REVEAL_START}${JSON.stringify(payload)}${REVEAL_END}`;
}

/**
 * Client side: given everything received so far for one assistant turn,
 * return the text that's safe to show as message content (all reveal blocks
 * stripped out) plus every complete reveal payload found. Pure and
 * idempotent — safe to call on the full accumulated buffer every time a new
 * chunk arrives, rather than trying to track partial state across calls.
 *
 * A reveal marker that's started but not yet finished (its `REVEAL_END`
 * hasn't streamed in yet) is treated as pending: excluded from `visible`
 * (so raw NUL bytes never flash on screen) and not yet returned in
 * `reveals`. The next call, once the rest has arrived, picks it up.
 */
export function extractReveals(buffer: string): { visible: string; reveals: RevealPayload[] } {
  const reveals: RevealPayload[] = [];
  let visible = "";
  let rest = buffer;

  for (;;) {
    const startIdx = rest.indexOf(REVEAL_START);
    if (startIdx === -1) {
      visible += rest;
      break;
    }
    visible += rest.slice(0, startIdx);
    const afterStart = rest.slice(startIdx + REVEAL_START.length);
    const endIdx = afterStart.indexOf(REVEAL_END);
    if (endIdx === -1) {
      // Marker still streaming in — stop here; don't show it, don't consume it.
      break;
    }
    const payloadJson = afterStart.slice(0, endIdx);
    try {
      reveals.push(JSON.parse(payloadJson) as RevealPayload);
    } catch {
      // Malformed payload — drop it rather than crash the stream.
    }
    rest = afterStart.slice(endIdx + REVEAL_END.length);
  }

  return { visible, reveals };
}
