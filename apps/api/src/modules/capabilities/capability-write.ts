import { z } from "zod";
import {
  and,
  capabilities,
  desc,
  encryptSecret,
  eq,
  ilike,
  type CapabilityBilling,
  type CapabilitySpec,
  type Database,
  type UpstreamAuth,
} from "@tael/database";
import { TaelError } from "@tael/types";

/** One priced operation in a publish request. */
const operationInputSchema = z.object({
  name: z.string().min(1),
  path: z.string().max(200).optional().default(""),
  method: z.string().max(10).optional().default("POST"),
  price: z.string().regex(/^\d+(\.\d+)?$/, "price must be a decimal string, e.g. 0.01"),
  sampleRequest: z.string().max(4000).optional().default(""),
  sampleResponse: z.string().max(4000).optional().default(""),
});

/** How Tael authenticates to the publisher's upstream. */
const authInputSchema = z
  .object({
    scheme: z.enum(["bearer", "header", "none"]).default("bearer"),
    header: z.string().max(100).optional(),
    extraHeaders: z.record(z.string()).optional(),
  })
  .optional();

/** The shape a publisher (or their AI) sends to create a capability from code. */
export const publishInputSchema = z.object({
  name: z.string().min(2).max(80),
  kind: z.enum(["api", "mcp", "agent", "model", "dataset", "credit"]),
  description: z.string().min(10).max(500),
  logoUrl: z.string().url().max(200_000).optional(),
  contact: z.string().max(200).optional(),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  /** The real upstream endpoint Tael proxies to. */
  endpoint: z.string().url(),
  /** Upstream credential — encrypted at rest, never returned. */
  secret: z.string().max(500).optional(),
  auth: authInputSchema,
  /** Stellar address that receives USDC earnings. */
  payTo: z.string().regex(/^G[A-Z2-7]{55}$/, "payTo must be a Stellar public key"),
  operations: z.array(operationInputSchema).min(1, "add at least one operation"),
  faqs: z
    .array(z.object({ question: z.string().min(1), answer: z.string().default("") }))
    .optional()
    .default([]),
  /** Metered (per-token) billing for model capabilities. */
  billing: z
    .object({
      metered: z.boolean(),
      model: z.string().optional(),
      maxTokens: z.number().int().positive().optional(),
    })
    .optional(),
});

export type PublishInput = z.infer<typeof publishInputSchema>;
/** Update accepts the same fields, all optional. */
export const updateInputSchema = publishInputSchema.partial();
export type UpdateInput = z.infer<typeof updateInputSchema>;

/** A capability as returned to its publisher (no secret). */
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

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "capability"
  );
}

function buildUpstreamAuth(auth: PublishInput["auth"]): UpstreamAuth | null {
  if (!auth) return null;
  const hasExtra = auth.extraHeaders && Object.keys(auth.extraHeaders).length > 0;
  if (auth.scheme === "bearer" && !hasExtra) return null;
  return {
    scheme: auth.scheme,
    header: auth.scheme === "header" ? auth.header : undefined,
    extraHeaders: hasExtra ? auth.extraHeaders : undefined,
  };
}

function buildSpec(operations: PublishInput["operations"]): CapabilitySpec {
  const taken = new Set<string>();
  return {
    operations: operations.map((op, i) => {
      const base = slugify(op.name) || `op-${i + 1}`;
      let opSlug = base;
      for (let n = 2; taken.has(opSlug); n += 1) opSlug = `${base}-${n}`;
      taken.add(opSlug);
      return {
        name: op.name,
        slug: opSlug,
        path: op.path || undefined,
        method: op.method || undefined,
        sampleRequest: op.sampleRequest || undefined,
        sampleResponse: op.sampleResponse || undefined,
        price: op.price,
      };
    }),
  };
}

function minPrice(operations: PublishInput["operations"]): string {
  return operations.reduce(
    (min, op) => (Number(op.price) < Number(min) ? op.price : min),
    operations[0]?.price ?? "0",
  );
}

/**
 * Write side of capabilities for the public SDK/API: create, list, update, and
 * delete a capability owned by the publisher resolved from their Tael API key.
 * Mirrors the dashboard's publish/edit logic so both surfaces behave the same.
 * A create lands `pending`; Tael still grants Verified.
 */
export class CapabilityWriteService {
  constructor(private readonly db: Database | undefined) {}

  private get database(): Database {
    if (!this.db) throw new TaelError("INTERNAL", "DATABASE_URL is not configured.");
    return this.db;
  }

  private async uniqueSlug(base: string): Promise<string> {
    const rows = await this.database
      .select({ slug: capabilities.slug })
      .from(capabilities)
      .where(ilike(capabilities.slug, `${base}%`));
    const taken = new Set(rows.map((r) => r.slug));
    if (!taken.has(base)) return base;
    for (let i = 2; ; i += 1) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
  }

  async create(ownerId: string, input: PublishInput): Promise<{ id: string; slug: string }> {
    const slug = await this.uniqueSlug(slugify(input.name));
    const [row] = await this.database
      .insert(capabilities)
      .values({
        slug,
        name: input.name,
        description: input.description,
        logoUrl: input.logoUrl ?? null,
        contact: input.contact ?? null,
        kind: input.kind,
        visibility: input.visibility,
        status: "pending",
        faqs: input.faqs.filter((f) => f.answer.trim().length > 0),
        spec: buildSpec(input.operations),
        price: minPrice(input.operations),
        payTo: input.payTo,
        upstreamUrl: input.endpoint,
        upstreamSecretEnc: input.secret ? encryptSecret(input.secret) : null,
        upstreamAuth: buildUpstreamAuth(input.auth),
        billing: (input.billing as CapabilityBilling | undefined) ?? null,
        publisherId: ownerId,
      })
      .returning({ id: capabilities.id, slug: capabilities.slug });
    return { id: row!.id, slug: row!.slug };
  }

  async listOwned(ownerId: string): Promise<OwnedCapability[]> {
    const rows = await this.database
      .select({
        id: capabilities.id,
        slug: capabilities.slug,
        name: capabilities.name,
        kind: capabilities.kind,
        status: capabilities.status,
        visibility: capabilities.visibility,
        price: capabilities.price,
        createdAt: capabilities.createdAt,
      })
      .from(capabilities)
      .where(eq(capabilities.publisherId, ownerId))
      .orderBy(desc(capabilities.createdAt));
    return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
  }

  /** Update a capability the owner holds. Only provided fields change; a blank
   *  secret keeps the existing one. Returns null if it doesn't exist / not owned. */
  async update(ownerId: string, id: string, input: UpdateInput): Promise<{ slug: string } | null> {
    const [existing] = await this.database
      .select({ id: capabilities.id, slug: capabilities.slug })
      .from(capabilities)
      .where(and(eq(capabilities.id, id), eq(capabilities.publisherId, ownerId)))
      .limit(1);
    if (!existing) return null;

    const set: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) set.name = input.name;
    if (input.description !== undefined) set.description = input.description;
    if (input.logoUrl !== undefined) set.logoUrl = input.logoUrl || null;
    if (input.contact !== undefined) set.contact = input.contact || null;
    if (input.kind !== undefined) set.kind = input.kind;
    if (input.visibility !== undefined) set.visibility = input.visibility;
    if (input.endpoint !== undefined) set.upstreamUrl = input.endpoint;
    if (input.payTo !== undefined) set.payTo = input.payTo;
    if (input.secret) set.upstreamSecretEnc = encryptSecret(input.secret);
    if (input.auth !== undefined) set.upstreamAuth = buildUpstreamAuth(input.auth);
    if (input.billing !== undefined) set.billing = input.billing ?? null;
    if (input.faqs !== undefined) set.faqs = input.faqs.filter((f) => f.answer.trim().length > 0);
    if (input.operations !== undefined) {
      set.spec = buildSpec(input.operations);
      set.price = minPrice(input.operations);
    }

    await this.database.update(capabilities).set(set).where(eq(capabilities.id, id));
    return { slug: existing.slug };
  }

  /** Delete a capability the owner holds. Returns false if not found / not owned. */
  async remove(ownerId: string, id: string): Promise<boolean> {
    const deleted = await this.database
      .delete(capabilities)
      .where(and(eq(capabilities.id, id), eq(capabilities.publisherId, ownerId)))
      .returning({ id: capabilities.id });
    return deleted.length > 0;
  }
}
