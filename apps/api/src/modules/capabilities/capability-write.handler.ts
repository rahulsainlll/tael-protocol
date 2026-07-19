import { type Container } from "../../container";
import { publishInputSchema, updateInputSchema } from "./capability-write";

/** The slice of the container these handlers need. */
type WriteDeps = Pick<Container, "capabilityWrites" | "keys">;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Resolve the publisher (owner user id) from the Tael API key, or null. */
async function authenticatePublisher(deps: WriteDeps, request: Request): Promise<string | null> {
  const header = request.headers.get("authorization");
  const match = header ? /^Bearer\s+(tael_live_[A-Za-z0-9]+)$/i.exec(header.trim()) : null;
  if (!match) return null;
  const key = await deps.keys.authorize(match[1]!);
  return key?.ownerId ?? null;
}

async function parseBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** POST /capabilities — publish a capability from the SDK. */
export async function handleCreateCapability(deps: WriteDeps, request: Request): Promise<Response> {
  const ownerId = await authenticatePublisher(deps, request);
  if (!ownerId) return json({ error: "A valid Tael API key is required to publish." }, 401);

  const parsed = publishInputSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return json({ error: "Invalid capability", issues: parsed.error.issues }, 422);
  }

  try {
    const result = await deps.capabilityWrites.create(ownerId, parsed.data);
    return json({ id: result.id, slug: result.slug, status: "pending" }, 201);
  } catch (error) {
    console.error("[capabilities] SDK publish failed:", error);
    return json({ error: "Could not publish. Try again." }, 500);
  }
}

/** GET /me/capabilities — list the caller's own capabilities. */
export async function handleListOwnCapabilities(
  deps: WriteDeps,
  request: Request,
): Promise<Response> {
  const ownerId = await authenticatePublisher(deps, request);
  if (!ownerId) return json({ error: "A valid Tael API key is required." }, 401);
  const items = await deps.capabilityWrites.listOwned(ownerId);
  return json({ capabilities: items }, 200);
}

/** PATCH /capabilities/:id — update a capability the caller owns. */
export async function handleUpdateCapability(
  deps: WriteDeps,
  id: string,
  request: Request,
): Promise<Response> {
  const ownerId = await authenticatePublisher(deps, request);
  if (!ownerId) return json({ error: "A valid Tael API key is required." }, 401);

  const parsed = updateInputSchema.safeParse(await parseBody(request));
  if (!parsed.success) {
    return json({ error: "Invalid update", issues: parsed.error.issues }, 422);
  }

  try {
    const result = await deps.capabilityWrites.update(ownerId, id, parsed.data);
    if (!result) return json({ error: "Capability not found or not yours." }, 404);
    return json({ id, slug: result.slug }, 200);
  } catch (error) {
    console.error("[capabilities] SDK update failed:", error);
    return json({ error: "Could not update. Try again." }, 500);
  }
}

/** DELETE /capabilities/:id — unpublish a capability the caller owns. */
export async function handleDeleteCapability(
  deps: WriteDeps,
  id: string,
  request: Request,
): Promise<Response> {
  const ownerId = await authenticatePublisher(deps, request);
  if (!ownerId) return json({ error: "A valid Tael API key is required." }, 401);
  const removed = await deps.capabilityWrites.remove(ownerId, id);
  if (!removed) return json({ error: "Capability not found or not yours." }, 404);
  return json({ ok: true }, 200);
}
