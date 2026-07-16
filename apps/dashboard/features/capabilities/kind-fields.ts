/**
 * Per-kind spec fields for the publish wizard. This is how we solve "api / mcp /
 * agent aren't the same" — each kind declares which contract fields to collect
 * and how to label them, driven from one config.
 */
export interface KindFields {
  /** Show an HTTP method selector (APIs). */
  method: boolean;
  urlLabel: string;
  urlPlaceholder: string;
  requestLabel: string;
  requestPlaceholder: string;
  responseLabel: string;
  responsePlaceholder: string;
}

// Example only — shown as a greyed-out placeholder. It is never sent unless the
// publisher actually types a body into the field.
const API_REQUEST = `{
  "document_url": "https://example.com/invoice.pdf",
  "language": "en"
}`;

const API_RESPONSE = `{
  "text": "INVOICE #1042 …",
  "pages": 3,
  "confidence": 0.98
}`;

export const KIND_FIELDS: Record<string, KindFields> = {
  api: {
    method: true,
    urlLabel: "Endpoint URL",
    urlPlaceholder: "https://api.example.com/v1/ocr",
    requestLabel: "Sample request",
    requestPlaceholder: API_REQUEST,
    responseLabel: "Sample response",
    responsePlaceholder: API_RESPONSE,
  },
  mcp: {
    method: false,
    urlLabel: "MCP server URL",
    urlPlaceholder: "https://mcp.example.com/sse",
    requestLabel: "Sample tool call",
    requestPlaceholder: `{ "tool": "search", "arguments": { "query": "…" } }`,
    responseLabel: "Sample tool result",
    responsePlaceholder: `{ "results": [ … ] }`,
  },
  agent: {
    method: false,
    urlLabel: "Agent endpoint",
    urlPlaceholder: "https://agent.example.com/run",
    requestLabel: "Sample task",
    requestPlaceholder: `{ "task": "Summarize the top 5 suppliers for …" }`,
    responseLabel: "Sample output",
    responsePlaceholder: `{ "report": "…", "citations": [ … ] }`,
  },
  model: {
    method: true,
    urlLabel: "Inference endpoint",
    urlPlaceholder: "https://api.example.com/v1/generate",
    requestLabel: "Sample input",
    requestPlaceholder: `{ "prompt": "…", "max_tokens": 256 }`,
    responseLabel: "Sample output",
    responsePlaceholder: `{ "output": "…" }`,
  },
  dataset: {
    method: false,
    urlLabel: "Dataset endpoint",
    urlPlaceholder: "https://api.example.com/v1/prices",
    requestLabel: "Query example",
    requestPlaceholder: `{ "symbol": "AAPL", "range": "1d" }`,
    responseLabel: "Sample rows",
    responsePlaceholder: `[ { "date": "2026-07-12", "close": 231.4 } ]`,
  },
  credit: {
    method: true,
    urlLabel: "Underwriting endpoint",
    urlPlaceholder: "https://trustline.onrender.com/agent/:address/available-credit",
    requestLabel: "Sample request",
    requestPlaceholder: `GET /agent/GABC…XYZ/available-credit`,
    responseLabel: "Sample response",
    responsePlaceholder: `{ "agent": "GABC…XYZ", "rampedLimitUsdc": 12.5, "tier": 2, "aprBps": 850 }`,
  },
};

export function kindFields(kind: string): KindFields {
  return KIND_FIELDS[kind] ?? KIND_FIELDS.api!;
}

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
