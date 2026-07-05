import { z } from "zod";
import { publicProcedure, router } from "../../trpc/trpc";
import { recordPaymentInput } from "./payment.schema";

export const paymentRouter = router({
  record: publicProcedure
    .input(recordPaymentInput)
    .mutation(({ input, ctx }) => ctx.container.payments.record(input)),

  list: publicProcedure.query(({ ctx }) => ctx.container.payments.list()),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => ctx.container.payments.get(input.id)),
});
