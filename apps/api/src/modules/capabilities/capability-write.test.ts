import { describe, expect, it, vi } from "vitest";
import {
  handleCreateCapability,
  handleDeleteCapability,
  handleListOwnCapabilities,
  handleUpdateCapability,
} from "./capability-write.handler";
import { type CapabilityWriteService } from "./capability-write";
import { type KeyPaymentService } from "../keys/key.service";

const KEY = "tael_live_abcdef123456";
const OWNER = "user-1";

/** Fake key auth: any known key resolves to OWNER; anything else is unknown. */
function fakeKeys(ownerId: string | null): KeyPaymentService {
  return {
    authorize: (raw: string) =>
      Promise.resolve(raw === KEY && ownerId ? { id: "k1", ownerId, card: null } : null),
  } as unknown as KeyPaymentService;
}

function fakeWrites(overrides: Partial<CapabilityWriteService> = {}): CapabilityWriteService {
  return {
    create: vi.fn(async () => ({ id: "cap-1", slug: "my-api" })),
    listOwned: vi.fn(async () => [
      {
        id: "cap-1",
        slug: "my-api",
        name: "My API",
        kind: "api",
        status: "pending",
        visibility: "public",
        price: "0.01",
        createdAt: new Date().toISOString(),
      },
    ]),
    update: vi.fn(async () => ({ slug: "my-api" })),
    remove: vi.fn(async () => true),
    ...overrides,
  } as unknown as CapabilityWriteService;
}

const validBody = {
  name: "My API",
  kind: "api",
  description: "Does a useful thing for agents.",
  endpoint: "https://api.example.com/v1",
  payTo: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  operations: [{ name: "Predict", path: "/predict", price: "0.01" }],
};

function req(body: unknown, key = KEY): Request {
  return new Request("http://localhost/capabilities", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("capability write API", () => {
  it("publishes a capability from a valid key + body (201, pending)", async () => {
    const deps = { capabilityWrites: fakeWrites(), keys: fakeKeys(OWNER) };
    const res = await handleCreateCapability(deps, req(validBody));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; slug: string; status: string };
    expect(body).toMatchObject({ id: "cap-1", slug: "my-api", status: "pending" });
    expect(deps.capabilityWrites.create).toHaveBeenCalledWith(
      OWNER,
      expect.objectContaining({ name: "My API" }),
    );
  });

  it("rejects publishing without a valid API key (401)", async () => {
    const deps = { capabilityWrites: fakeWrites(), keys: fakeKeys(null) };
    const res = await handleCreateCapability(deps, req(validBody, "tael_live_bogus"));
    expect(res.status).toBe(401);
    expect(deps.capabilityWrites.create).not.toHaveBeenCalled();
  });

  it("rejects an invalid body (422) without touching the service", async () => {
    const deps = { capabilityWrites: fakeWrites(), keys: fakeKeys(OWNER) };
    const res = await handleCreateCapability(deps, req({ name: "x" }));
    expect(res.status).toBe(422);
    expect(deps.capabilityWrites.create).not.toHaveBeenCalled();
  });

  it("lists the caller's own capabilities", async () => {
    const deps = { capabilityWrites: fakeWrites(), keys: fakeKeys(OWNER) };
    const res = await handleListOwnCapabilities(
      deps,
      new Request("http://localhost/me/capabilities", {
        headers: { authorization: `Bearer ${KEY}` },
      }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { capabilities: unknown[] };
    expect(body.capabilities).toHaveLength(1);
  });

  it("404s when updating a capability the caller doesn't own", async () => {
    const deps = {
      capabilityWrites: fakeWrites({ update: vi.fn(async () => null) as never }),
      keys: fakeKeys(OWNER),
    };
    const res = await handleUpdateCapability(
      deps,
      "cap-x",
      req({ description: "new description here" }),
    );
    expect(res.status).toBe(404);
  });

  it("deletes a capability the caller owns", async () => {
    const deps = { capabilityWrites: fakeWrites(), keys: fakeKeys(OWNER) };
    const res = await handleDeleteCapability(
      deps,
      "cap-1",
      new Request("http://localhost/capabilities/cap-1", {
        method: "DELETE",
        headers: { authorization: `Bearer ${KEY}` },
      }),
    );
    expect(res.status).toBe(200);
    expect(deps.capabilityWrites.remove).toHaveBeenCalledWith(OWNER, "cap-1");
  });
});
