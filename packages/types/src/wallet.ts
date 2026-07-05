import { z } from "zod";
import { moneyAmountSchema } from "./money";

/** A Stellar public key (account address), e.g. `G...` (56 chars). */
export const stellarAddressSchema = z.string().regex(/^G[A-Z2-7]{55}$/, "Invalid Stellar address");

export type StellarAddress = z.infer<typeof stellarAddressSchema>;

export const walletSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  address: stellarAddressSchema,
  /** Cached balance as a decimal string; the chain remains the source of truth. */
  balance: moneyAmountSchema,
  createdAt: z.string().datetime(),
});

export type Wallet = z.infer<typeof walletSchema>;
