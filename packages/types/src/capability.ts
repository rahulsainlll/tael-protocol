import { z } from "zod";
import { moneyAmountSchema } from "./money";
import { stellarAddressSchema } from "./wallet";

/** The kinds of purchasable capabilities an agent can consume. */
export const capabilityKindSchema = z.enum(["api", "mcp", "agent", "model", "dataset", "credit"]);
export type CapabilityKind = z.infer<typeof capabilityKindSchema>;

export const capabilitySchema = z.object({
  id: z.string(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be kebab-case"),
  name: z.string().min(1),
  description: z.string().default(""),
  kind: capabilityKindSchema,
  /** Price charged per successful call, as a decimal string. */
  price: moneyAmountSchema,
  /** Stellar address that receives settlement for this capability. */
  payTo: stellarAddressSchema,
  publisherId: z.string(),
  createdAt: z.string().datetime(),
});

export type Capability = z.infer<typeof capabilitySchema>;
