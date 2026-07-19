import "server-only";
import { getDatabase, type Database } from "@tael/database";

/**
 * Server-only database handle for chat. Lazy: the connection is created on
 * first actual query (never at import/build time), so `next build` doesn't
 * need DATABASE_URL. `server-only` keeps it out of any client bundle.
 */
export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDatabase();
    const value = Reflect.get(instance as object, prop);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
