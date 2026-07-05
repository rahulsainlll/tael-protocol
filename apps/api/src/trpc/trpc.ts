import { initTRPC } from "@trpc/server";
import { type Context } from "./context";

const t = initTRPC.context<Context>().create();

/** Build a router. */
export const router = t.router;
/** A procedure with no auth requirement (auth middleware lands with @tael/auth). */
export const publicProcedure = t.procedure;
