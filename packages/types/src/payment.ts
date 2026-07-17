import { z } from "zod";
import { moneyAmountSchema } from "./money";
import { stellarAddressSchema } from "./wallet";

export const paymentStatusSchema = z.enum(["pending", "settled", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  /** Capability name at settlement time, kept so history survives its deletion. */
  capabilityName: z.string().nullable().default(null),
  payer: stellarAddressSchema,
  payee: stellarAddressSchema,
  /** Amount the payee (builder) receives, in USDC. */
  amount: moneyAmountSchema,
  /** Marketplace fee taken by Tael in the same transaction, in USDC. */
  fee: moneyAmountSchema.default("0"),
  status: paymentStatusSchema,
  /** Stellar transaction hash once settled; `null` while pending. */
  txHash: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Payment = z.infer<typeof paymentSchema>;
