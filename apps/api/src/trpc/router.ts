import { router } from "./trpc";
import { walletRouter } from "../modules/wallets/wallet.router";
import { paymentRouter } from "../modules/payments/payment.router";

/**
 * The root tRPC router. Each domain contributes one namespaced sub-router.
 * `AppRouter` is the type a typed client (dashboard, SDK) imports for end-to-end
 * type safety.
 */
export const appRouter = router({
  wallets: walletRouter,
  payments: paymentRouter,
});

export type AppRouter = typeof appRouter;
