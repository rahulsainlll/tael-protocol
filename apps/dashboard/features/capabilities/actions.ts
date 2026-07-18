"use server";

import { revalidatePath } from "next/cache";
import {
  and,
  capabilities,
  encryptSecret,
  eq,
  ilike,
  type CapabilityFaq,
  type CapabilitySpec,
  type UpstreamAuth,
} from "@tael/database";
import { generateFaqQuestions } from "@tael/claude";
import { db } from "../../lib/db";
import { getCurrentUser } from "./current-user";
import { minPrice, parseHeaderLines, publishCapabilitySchema, slugify } from "./schema";

/** Build the stored UpstreamAuth from the publisher's choices, or null for the
 *  plain Bearer default (keeps existing behavior + a compact row). */
function buildUpstreamAuth(input: {
  authScheme: "bearer" | "header" | "none";
  authHeader: string;
  authExtraHeaders: string;
}): UpstreamAuth | null {
  const extra = parseHeaderLines(input.authExtraHeaders);
  const hasExtra = Object.keys(extra).length > 0;
  // Plain bearer with no static headers = the default → store null.
  if (input.authScheme === "bearer" && !hasExtra) return null;
  return {
    scheme: input.authScheme,
    header: input.authScheme === "header" ? input.authHeader || undefined : undefined,
    extraHeaders: hasExtra ? extra : undefined,
  };
}

/** Live result of calling a capability's endpoint during verification. */
export interface TestResult {
  name: string;
  ok: boolean;
  status: number | null;
  response: string;
  error?: string;
}

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Test ONE request against the upstream endpoint and return the live result.
 * Called per-request from the Test step so the publisher can run (and re-run)
 * each request themselves after editing.
 */
export async function testRequest(input: {
  name: string;
  url: string;
  method: string;
  body: string;
  secret: string;
  authScheme?: "bearer" | "header" | "none";
  authHeader?: string;
  authExtraHeaders?: string;
}): Promise<{ ok: boolean; result?: TestResult; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const result = await testUpstream({
    name: input.name || "Request",
    url: input.url,
    method: input.method || "POST",
    body: input.body,
    secret: input.secret,
    authScheme: input.authScheme ?? "bearer",
    authHeader: input.authHeader ?? "",
    authExtraHeaders: input.authExtraHeaders ?? "",
  });
  return { ok: true, result };
}

/**
 * Feed the real (tested) request + response to Claude to generate buyer-relevant
 * questions grounded in what the endpoint actually returned. Metered to the user.
 */
export async function generateQuestions(input: {
  kind: string;
  name: string;
  description: string;
  sampleRequest?: string;
  sampleResponse?: string;
}): Promise<{ ok: boolean; questions?: string[]; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const questions = await generateFaqQuestions({ ...input, userAddress: user.walletAddress });
  return { ok: true, questions };
}

/**
 * Turn a base slug into a unique one, keeping the clean name the publisher chose.
 * Returns `cat-facts` when free; only falls back to `cat-facts-2`, `-3`, … when
 * the name is already taken. Keeps public URLs human — no random suffix.
 */
async function uniqueSlug(base: string): Promise<string> {
  const rows = await db
    .select({ slug: capabilities.slug })
    .from(capabilities)
    .where(ilike(capabilities.slug, `${base}%`));
  const taken = new Set(rows.map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Step 3 (final): publish with the tested responses + FAQ answers. Each request
 * stores its real captured response as the public sample. Headline price is the
 * cheapest operation.
 */
export async function publishCapability(
  formData: FormData,
): Promise<ActionResult & { slug?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const parsed = publishCapabilitySchema.safeParse({
    ...readDescribe(formData),
    faqs: safeParseJson(formData.get("faqs")),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  const input = parsed.data;

  const faqs: CapabilityFaq[] = input.faqs.filter((f) => f.answer.trim().length > 0);
  // Give each operation a URL-safe slug (from its name) so buyers can address it
  // at /c/<slug>/<operation>; dedupe collisions with a numeric suffix.
  const opSlugs = new Set<string>();
  const spec: CapabilitySpec = {
    operations: input.operations.map((op, i) => {
      const base = slugify(op.name || `op-${i + 1}`) || `op-${i + 1}`;
      let opSlug = base;
      for (let n = 2; opSlugs.has(opSlug); n += 1) opSlug = `${base}-${n}`;
      opSlugs.add(opSlug);
      return {
        name: op.name || "Request",
        slug: opSlug,
        path: op.path || undefined,
        method: op.method || undefined,
        sampleRequest: op.sampleRequest || undefined,
        sampleResponse: op.sampleResponse || undefined,
        price: op.price,
      };
    }),
  };
  const slug = await uniqueSlug(slugify(input.name));

  try {
    await db.insert(capabilities).values({
      slug,
      name: input.name,
      description: input.description,
      logoUrl: input.logoUrl || null,
      contact: input.contact || null,
      kind: input.kind,
      visibility: input.visibility,
      status: "verified",
      faqs,
      spec,
      price: minPrice(input.operations),
      payTo: input.payTo,
      upstreamUrl: input.upstreamUrl,
      upstreamSecretEnc: input.upstreamSecret ? encryptSecret(input.upstreamSecret) : null,
      upstreamAuth: buildUpstreamAuth(input),
      publisherId: user.id,
    });
  } catch (error) {
    console.error("[capabilities] publish failed:", error);
    return { ok: false, error: "Could not publish. Try again." };
  }

  revalidatePath("/capabilities");
  revalidatePath("/marketplace");
  return { ok: true, slug };
}

/** Delete a capability the signed-in user owns. */
export async function deleteCapability(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };

  try {
    await db
      .delete(capabilities)
      .where(and(eq(capabilities.id, id), eq(capabilities.publisherId, user.id)));
  } catch (error) {
    console.error("[capabilities] delete failed:", error);
    return { ok: false, error: "Could not delete. Try again." };
  }

  revalidatePath("/capabilities");
  revalidatePath("/marketplace");
  return { ok: true };
}

// --- helpers ---

/** Basic SSRF guard: reject non-http(s) and obviously-internal hosts. */
function isBlockedUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return true;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  const host = url.hostname;
  return (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.endsWith(".local") ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

function prettyMaybeJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** Call the upstream endpoint once and capture the live response (bounded). */
async function testUpstream(args: {
  name: string;
  url: string;
  method: string;
  body: string;
  secret: string;
  authScheme: "bearer" | "header" | "none";
  authHeader: string;
  authExtraHeaders: string;
}): Promise<TestResult> {
  if (isBlockedUrl(args.url)) {
    return {
      name: args.name,
      ok: false,
      status: null,
      response: "",
      error: "Endpoint not allowed",
    };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    // Mirror the gateway's auth injection so the test hits the endpoint the same
    // way a live call will (Bearer, a named header like x-api-key, or none).
    const headers: Record<string, string> = { accept: "application/json" };
    if (args.secret) {
      if (args.authScheme === "bearer") headers.authorization = `Bearer ${args.secret}`;
      else if (args.authScheme === "header" && args.authHeader)
        headers[args.authHeader] = args.secret;
    }
    for (const [k, v] of Object.entries(parseHeaderLines(args.authExtraHeaders))) headers[k] = v;
    let reqBody: string | undefined;
    if (args.method !== "GET" && args.method !== "DELETE" && args.body.trim()) {
      headers["content-type"] = "application/json";
      reqBody = args.body;
    }
    const res = await fetch(args.url, {
      method: args.method,
      headers,
      body: reqBody,
      signal: controller.signal,
    });
    const text = (await res.text()).slice(0, 20000);
    return { name: args.name, ok: res.ok, status: res.status, response: prettyMaybeJson(text) };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Timed out after 15s"
          : error.message
        : "Request failed";
    return { name: args.name, ok: false, status: null, response: "", error: message };
  } finally {
    clearTimeout(timer);
  }
}

function safeParseJson(value: FormDataEntryValue | null): unknown {
  if (typeof value !== "string") return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

/** Read the shared "describe" fields from a FormData (used by both steps). */
function readDescribe(formData: FormData): Record<string, unknown> {
  return {
    name: formData.get("name"),
    kind: formData.get("kind"),
    description: formData.get("description") ?? "",
    logoUrl: formData.get("logoUrl") ?? "",
    contact: formData.get("contact") ?? "",
    payTo: formData.get("payTo"),
    upstreamUrl: formData.get("upstreamUrl"),
    upstreamSecret: formData.get("upstreamSecret") ?? "",
    authScheme: formData.get("authScheme") ?? "bearer",
    authHeader: formData.get("authHeader") ?? "",
    authExtraHeaders: formData.get("authExtraHeaders") ?? "",
    visibility: formData.get("visibility") ?? "public",
    operations: safeParseJson(formData.get("operations")),
  };
}
