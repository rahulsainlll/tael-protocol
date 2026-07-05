import { z } from "zod";
import { stellarAddressSchema } from "@tael/types";

/** Input to create a wallet. Kept separate from the domain entity in @tael/types. */
export const createWalletInput = z.object({
  ownerId: z.string().min(1),
  address: stellarAddressSchema,
});

export type CreateWalletInput = z.infer<typeof createWalletInput>;
