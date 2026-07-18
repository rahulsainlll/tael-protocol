import { z } from "zod";
import { capabilityKindSchema, moneyAmountSchema, stellarAddressSchema } from "@tael/types";

/** One callable operation: sample request/response + its own price per call.
 *  `path` is an optional sub-path appended to the capability's upstream URL, so
 *  one capability can expose many priced operations (a balance read, a swap…),
 *  each addressed at `/c/<slug>/<operation>`. Empty path means the base URL. */
export const operationSchema = z.object({
  name: z.string().max(80).optional().default(""),
  path: z
    .string()
    .max(200)
    .optional()
    .default("")
    .refine((v) => v === "" || !/^https?:\/\//.test(v), "Use a path like /swap, not a full URL"),
  method: z.string().max(10).optional().default(""),
  sampleRequest: z.string().max(4000).optional().default(""),
  sampleResponse: z.string().max(4000).optional().default(""),
  price: moneyAmountSchema,
});

export type OperationInput = z.infer<typeof operationSchema>;

/** Step 1 of the wizard: description + connection + the list of priced requests. */
export const describeCapabilitySchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  kind: capabilityKindSchema,
  description: z.string().min(10, "Add a short description").max(500),
  logoUrl: z
    .string()
    .max(200_000) // room for a compact uploaded data URL (~5-10KB) or a plain URL
    .optional()
    .default("")
    .refine(
      (v) => v === "" || /^https?:\/\//.test(v) || /^data:image\//.test(v),
      "Enter a valid logo URL",
    ),
  contact: z
    .string()
    .max(200)
    .optional()
    .default("")
    .refine(
      (v) => v === "" || /\S+@\S+\.\S+/.test(v) || /^https?:\/\//.test(v) || /^@\w+/.test(v),
      "Enter an email, link, or @handle",
    ),
  payTo: stellarAddressSchema,
  upstreamUrl: z.string().url("Enter a valid URL"),
  upstreamSecret: z.string().max(500).optional().default(""),
  // How Tael sends the upstream secret: bearer (default), a named header
  // (e.g. x-api-key for Anthropic), or none. `authExtraHeaders` are static
  // headers always sent (e.g. "anthropic-version: 2023-06-01"), one per line.
  authScheme: z.enum(["bearer", "header", "none"]).optional().default("bearer"),
  authHeader: z.string().max(100).optional().default(""),
  authExtraHeaders: z.string().max(1000).optional().default(""),
  visibility: z.enum(["public", "unlisted", "private"]).default("public"),
  operations: z.array(operationSchema).min(1, "Add at least one request"),
});

/** Parse "Header-Name: value" lines into a record; ignores blanks/malformed. */
export function parseHeaderLines(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

export type DescribeCapabilityInput = z.infer<typeof describeCapabilitySchema>;

/** Step 2 (final): the above plus the publisher's answered FAQ. */
export const publishCapabilitySchema = describeCapabilitySchema.extend({
  faqs: z.array(z.object({ question: z.string(), answer: z.string().default("") })).default([]),
});

export type PublishCapabilityInput = z.infer<typeof publishCapabilitySchema>;

/** The lowest operation price (headline "from $X" on cards / meta). */
export function minPrice(operations: OperationInput[]): string {
  return operations.reduce(
    (min, op) => (Number(op.price) < Number(min) ? op.price : min),
    operations[0]?.price ?? "0",
  );
}

/** Build a URL-safe slug from a name (the action makes it unique on collision). */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
