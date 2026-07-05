import { z } from "zod";
import { moneyAmountSchema } from "./money";
import { stellarAddressSchema } from "./wallet";

export const paymentStatusSchema = z.enum(["pending", "settled", "failed"]);
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export const paymentSchema = z.object({
  id: z.string(),
  capabilityId: z.string(),
  payer: stellarAddressSchema,
  payee: stellarAddressSchema,
  amount: moneyAmountSchema,
  status: paymentStatusSchema,
  /** Stellar transaction hash once settled; `null` while pending. */
  txHash: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export type Payment = z.infer<typeof paymentSchema>;
