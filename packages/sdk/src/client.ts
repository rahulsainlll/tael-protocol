// The buy-side SDK: call any Tael capability with one API key.
//
// Where `tael()` (see ./tael) is what a builder wraps their service in to *sell*
// a capability, `Tael` is what a developer uses to *buy* — it points at the
// gateway, attaches your key, and returns the result. Payment happens server
// side from the Card your key is linked to, within that Card's caps; you never
// sign a transaction here.
//
//   import { Tael } from "@tael/sdk";
//   const tael = new Tael({ apiKey: process.env.TAEL_KEY! });
//   const joke = await tael.get("cat-facts");
//   const reply = await tael.post("claude", { prompt: "hi" });
import { PAYMENT_RESPONSE_HEADER, type SettlementReceipt } from "@tael/payments";

/** Where the gateway lives. Override for local dev or a self-hosted deployment. */
const DEFAULT_BASE_URL = "https://tael-protocol.onrender.com";

export interface TaelClientOptions {
  /** Your `tael_live_…` key. Get one in the dashboard under API Keys. */
  apiKey: string;
  /** Gateway base URL. Defaults to the hosted gateway. */
  baseUrl?: string;
  /** Inject a `fetch` implementation (tests, non-standard runtimes). */
  fetch?: typeof fetch;
}

/** A capability as returned by the discovery catalog. No secrets. */
export interface CatalogCapability {
  slug: string;
  name: string;
  description: string;
  kind: string;
  method: string | null;
  price: string;
  logoUrl: string | null;
  verified: boolean;
}

export interface ListOptions {
  /** Free-text search over name + description. */
  q?: string;
  /** Restrict to one kind (api | mcp | agent | model | dataset). */
  kind?: string;
  /** Page size (max 100). */
  limit?: number;
}

export interface CallOptions {
  method?: string;
  /** Request body. Objects are JSON-encoded; strings are sent as-is. */
  body?: unknown;
  /** Extra headers to forward to the capability. */
  headers?: Record<string, string>;
  /** Query string appended to the capability URL. */
  query?: Record<string, string | number>;
}

/** One priced operation when publishing a capability. */
export interface PublishOperation {
  name: string;
  /** Path appended to the endpoint, e.g. "/swap". Empty selects the base URL. */
  path?: string;
  method?: string;
  /** USDC per call, decimal string. "0" = free. */
  price: string;
  sampleRequest?: string;
  sampleResponse?: string;
}

/** How Tael authenticates to your upstream endpoint. */
export interface PublishAuth {
  scheme: "bearer" | "header" | "none";
  /** Header name when scheme = "header", e.g. "x-api-key". */
  header?: string;
  /** Static headers always sent, e.g. { "anthropic-version": "2023-06-01" }. */
  extraHeaders?: Record<string, string>;
}

/** The manifest to publish a capability from code. */
export interface PublishCapabilityInput {
  name: string;
  kind: "api" | "mcp" | "agent" | "model" | "dataset" | "credit";
  description: string;
  /** The real upstream endpoint Tael proxies to. */
  endpoint: string;
  /** Upstream credential — encrypted server-side, never returned. */
  secret?: string;
  auth?: PublishAuth;
  /** Stellar address that receives USDC earnings (needs a USDC trustline). */
  payTo: string;
  operations: PublishOperation[];
  /** Buyer-facing FAQ you write about your product. */
  faqs?: { question: string; answer: string }[];
  logoUrl?: string;
  contact?: string;
  visibility?: "public" | "unlisted" | "private";
  billing?: { metered: boolean; model?: string; maxTokens?: number };
}

/** A capability as returned to its publisher. */
export interface OwnedCapability {
  id: string;
  slug: string;
  name: string;
  kind: string;
  status: string;
  visibility: string;
  price: string;
  createdAt: string;
}

/** The full result of a paid call: the data, the HTTP status, and the receipt. */
export interface TaelResponse<T = unknown> {
  data: T;
  status: number;
  /** Decoded `X-PAYMENT-RESPONSE`: proof the payment settled on-chain. */
  receipt: SettlementReceipt | null;
}

/** Thrown when a capability call fails (non-2xx). Carries status + body. */
export class TaelError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "TaelError";
  }
}

function decodeReceipt(header: string | null): SettlementReceipt | null {
  if (!header) return null;
  try {
    const json =
      typeof atob === "function" ? atob(header) : Buffer.from(header, "base64").toString("utf8");
    return JSON.parse(json) as SettlementReceipt;
  } catch {
    return null;
  }
}

export class Tael {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: TaelClientOptions) {
    if (!options.apiKey) throw new Error("Tael: `apiKey` is required.");
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    const f = options.fetch ?? globalThis.fetch;
    if (!f) throw new Error("Tael: no `fetch` available — pass one via options.fetch.");
    this.fetchImpl = f;
  }

  /**
   * Call a capability and return the full response (data + status + receipt).
   * `slug` may address a specific operation as `"capability/operation"`
   * (e.g. `"nebula/swap"`), which is priced per operation.
   */
  async call<T = unknown>(slug: string, options: CallOptions = {}): Promise<TaelResponse<T>> {
    const path = slug.split("/").filter(Boolean).map(encodeURIComponent).join("/");
    const url = new URL(`${this.baseUrl}/c/${path}`);
    for (const [k, v] of Object.entries(options.query ?? {})) url.searchParams.set(k, String(v));

    const headers: Record<string, string> = {
      authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    let body: string | undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === "string") {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
        headers["content-type"] ??= "application/json";
      }
    }

    const res = await this.fetchImpl(url.toString(), {
      method: options.method ?? (body ? "POST" : "GET"),
      headers,
      body,
    });

    const data = (await parseBody(res)) as T;
    if (!res.ok) {
      const message =
        (data as { error?: string })?.error ?? `Tael call to "${slug}" failed (${res.status}).`;
      throw new TaelError(message, res.status, data);
    }
    return {
      data,
      status: res.status,
      receipt: decodeReceipt(res.headers.get(PAYMENT_RESPONSE_HEADER)),
    };
  }

  /** GET a capability and return its data directly. */
  async get<T = unknown>(
    slug: string,
    options: Omit<CallOptions, "method" | "body"> = {},
  ): Promise<T> {
    return (await this.call<T>(slug, { ...options, method: "GET" })).data;
  }

  /** POST to a capability and return its data directly. */
  async post<T = unknown>(
    slug: string,
    body?: unknown,
    options: Omit<CallOptions, "method" | "body"> = {},
  ): Promise<T> {
    return (await this.call<T>(slug, { ...options, method: "POST", body })).data;
  }

  /** List public, verified capabilities from the discovery catalog. */
  async list(options: ListOptions = {}): Promise<CatalogCapability[]> {
    const url = new URL(`${this.baseUrl}/capabilities`);
    if (options.q) url.searchParams.set("q", options.q);
    if (options.kind) url.searchParams.set("kind", options.kind);
    if (options.limit) url.searchParams.set("limit", String(options.limit));

    const res = await this.fetchImpl(url.toString());
    const data = (await parseBody(res)) as { capabilities?: CatalogCapability[] };
    if (!res.ok) throw new TaelError("Failed to list capabilities.", res.status, data);
    return data.capabilities ?? [];
  }

  /** Search the catalog by free text — shorthand for `list({ q })`. */
  search(query: string, options: Omit<ListOptions, "q"> = {}): Promise<CatalogCapability[]> {
    return this.list({ ...options, q: query });
  }

  // --- Publish side: manage the capabilities YOU sell (authenticated by key) ---

  /** An authenticated JSON request to the write API, keyed by your API key. */
  private async write<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await parseBody(res);
    if (!res.ok) {
      const message =
        (data as { error?: string })?.error ?? `Tael ${method} ${path} failed (${res.status}).`;
      throw new TaelError(message, res.status, data);
    }
    return data as T;
  }

  /**
   * Publish a capability from code. It goes live immediately, marked `pending`
   * until Tael grants Verified. Works for any kind (api, mcp, agent, model,
   * dataset, credit). Returns the new capability's id, slug, and status.
   */
  publish(input: PublishCapabilityInput): Promise<{ id: string; slug: string; status: string }> {
    return this.write("/capabilities", "POST", input);
  }

  /** List the capabilities you publish. */
  async myCapabilities(): Promise<OwnedCapability[]> {
    const data = await this.write<{ capabilities: OwnedCapability[] }>("/me/capabilities", "GET");
    return data.capabilities ?? [];
  }

  /** Update a capability you own. Only the fields you pass change; a blank
   *  secret keeps the current one. */
  updateCapability(
    id: string,
    input: Partial<PublishCapabilityInput>,
  ): Promise<{ id: string; slug: string }> {
    return this.write(`/capabilities/${encodeURIComponent(id)}`, "PATCH", input);
  }

  /** Unpublish (delete) a capability you own. */
  unpublish(id: string): Promise<{ ok: boolean }> {
    return this.write(`/capabilities/${encodeURIComponent(id)}`, "DELETE");
  }
}

/** Parse a response as JSON when it says so, else as text. */
async function parseBody(res: Response): Promise<unknown> {
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  return res.text();
}
