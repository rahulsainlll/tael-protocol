/**
 * Boundary to @tael/api. For now it only resolves the base URL; the typed tRPC
 * client (using the api's `AppRouter` type) is wired when data fetching begins —
 * deliberately deferred while this milestone is architecture-only.
 */
export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export function apiEndpoint(path: string): string {
  return new URL(path, apiUrl).toString();
}
