import { z } from "zod";
import { publicProcedure, router } from "../../trpc/trpc";
import { createWalletInput } from "./wallet.schema";

/** tRPC surface for the wallets domain. Thin: validate, delegate to the service. */
export const walletRouter = router({
  create: publicProcedure
    .input(createWalletInput)
    .mutation(({ input, ctx }) => ctx.container.wallets.create(input)),

  list: publicProcedure.query(({ ctx }) => ctx.container.wallets.list()),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.container.wallets.get(input.id)),
});
