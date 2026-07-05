import { z } from "zod";
import { moneyAmountSchema, stellarAddressSchema } from "@tael/types";

/** Input to record a payment against a capability call. */
export const recordPaymentInput = z.object({
  capabilityId: z.string().min(1),
  payer: stellarAddressSchema,
  payee: stellarAddressSchema,
  amount: moneyAmountSchema,
});

export type RecordPaymentInput = z.infer<typeof recordPaymentInput>;
