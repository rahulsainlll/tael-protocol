// @tael/database — the persistence layer.
// Drizzle schema, a typed Postgres client, and migrations. Everything the rest
// of the system reads/writes goes through here. App code depends on the client;
// the schema types are re-exported for repositories and services.
export * from "./client";
export * as schema from "./schema";
export * from "./schema";
