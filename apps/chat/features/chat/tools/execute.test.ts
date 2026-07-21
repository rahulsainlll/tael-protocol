import { describe, expect, it, vi } from "vitest";

vi.mock("./capabilities", () => ({
  searchCapabilities: vi.fn(),
  getCapabilityBySlug: vi.fn(),
}));

vi.mock("../../keys/queries", () => ({
  listCards: vi.fn(),
  createApiKey: vi.fn(),
}));

import { searchCapabilities, getCapabilityBySlug } from "./capabilities";
import { createApiKey, listCards } from "../../keys/queries";
import { executeTool } from "./execute";

const ctx = { userId: "user-1" };

describe("executeTool", () => {
  it("search_capabilities returns results and a plural summary", async () => {
    vi.mocked(searchCapabilities).mockResolvedValueOnce([
      { slug: "weather-api", name: "Weather API" } as never,
      { slug: "weather-pro", name: "Weather Pro" } as never,
    ]);

    const result = await executeTool("search_capabilities", { query: "weather" }, ctx);

    expect(searchCapabilities).toHaveBeenCalledWith("weather");
    expect(result.summary).toBe('Searched capabilities for "weather" — 2 results.');
    expect(result.forModel).toEqual({
      results: [
        { slug: "weather-api", name: "Weather API" },
        { slug: "weather-pro", name: "Weather Pro" },
      ],
    });
  });

  it("search_capabilities uses singular phrasing for exactly one result", async () => {
    vi.mocked(searchCapabilities).mockResolvedValueOnce([{ slug: "weather-api" } as never]);

    const result = await executeTool("search_capabilities", { query: "weather" }, ctx);

    expect(result.summary).toBe('Searched capabilities for "weather" — 1 result.');
  });

  it("search_capabilities reports zero results distinctly", async () => {
    vi.mocked(searchCapabilities).mockResolvedValueOnce([]);

    const result = await executeTool("search_capabilities", { query: "nonexistent" }, ctx);

    expect(result.summary).toBe('Searched capabilities for "nonexistent" — no results.');
    expect(result.forModel).toEqual({ results: [] });
  });

  it("search_capabilities short-circuits on a missing/blank query without hitting the db", async () => {
    const result = await executeTool("search_capabilities", { query: "   " }, ctx);

    expect(searchCapabilities).not.toHaveBeenCalled();
    expect(result.forModel).toEqual({ error: "Missing query." });
  });

  it("get_capability returns the capability on a hit", async () => {
    const capability = { slug: "weather-api", name: "Weather API", price: "0.01" };
    vi.mocked(getCapabilityBySlug).mockResolvedValueOnce(capability as never);

    const result = await executeTool("get_capability", { slug: "weather-api" }, ctx);

    expect(getCapabilityBySlug).toHaveBeenCalledWith("weather-api");
    expect(result.forModel).toEqual(capability);
    expect(result.summary).toBe('Looked up "Weather API" (weather-api).');
  });

  it("get_capability reports a model-facing error, not a throw, on a miss", async () => {
    vi.mocked(getCapabilityBySlug).mockResolvedValueOnce(null);

    const result = await executeTool("get_capability", { slug: "does-not-exist" }, ctx);

    expect(result.forModel).toEqual({ error: 'No public capability with slug "does-not-exist".' });
    expect(result.summary).toBe('Looked up "does-not-exist" — not found.');
  });

  it("an unknown tool name never throws — the model gets a normal error result back", async () => {
    const result = await executeTool("delete_everything", {}, ctx);

    expect(result.forModel).toEqual({ error: 'Unknown tool "delete_everything".' });
    expect(result.summary).toContain("delete_everything");
  });

  it("list_cards reports how many Cards the user has", async () => {
    vi.mocked(listCards).mockResolvedValueOnce([
      { id: "card-1", name: "Personal", address: null, policy: null },
    ]);

    const result = await executeTool("list_cards", {}, ctx);

    expect(listCards).toHaveBeenCalledWith(ctx.userId);
    expect(result.summary).toBe("Checked your Cards — 1 available.");
  });

  it("list_cards distinguishes the empty case", async () => {
    vi.mocked(listCards).mockResolvedValueOnce([]);

    const result = await executeTool("list_cards", {}, ctx);

    expect(result.summary).toBe("Checked your Cards — you don't have any yet.");
  });

  it("create_api_key redacts the raw key from forModel and delivers it only via `reveal`", async () => {
    const card = {
      id: "card-1",
      name: "Research bot",
      address: "GABC",
      policy: { maxPerCall: "1.00", dailyLimit: "10.00", blockedPublishers: [] },
    };
    vi.mocked(createApiKey).mockResolvedValueOnce({
      ok: true,
      key: "tael_live_abc123",
      prefix: "tael_live_ab12cd",
      card,
    });

    const result = await executeTool(
      "create_api_key",
      { name: "Research bot key", cardId: "card-1" },
      ctx,
    );

    expect(createApiKey).toHaveBeenCalledWith(ctx.userId, "Research bot key", "card-1");
    // The model-facing payload must never contain the raw key.
    expect(JSON.stringify(result.forModel)).not.toContain("tael_live_abc123");
    expect(result.forModel).toEqual({ ok: true, prefix: "tael_live_ab12cd", card });
    expect(result.summary).toBe('Created API key "Research bot key", linked to "Research bot".');
    expect(result.reveal).toEqual({
      type: "api_key",
      value: "tael_live_abc123",
      cardName: "Research bot",
    });
  });

  it("create_api_key omits cardName from the reveal when unlinked", async () => {
    vi.mocked(createApiKey).mockResolvedValueOnce({
      ok: true,
      key: "tael_live_xyz",
      prefix: "tael_live_xy12zz",
    });

    const result = await executeTool("create_api_key", { name: "Unlinked key" }, ctx);

    expect(createApiKey).toHaveBeenCalledWith(ctx.userId, "Unlinked key", null);
    expect(result.summary).toBe('Created API key "Unlinked key".');
    expect(result.reveal).toEqual({ type: "api_key", value: "tael_live_xyz", cardName: undefined });
  });

  it("create_api_key surfaces a failure without throwing, and without a reveal", async () => {
    vi.mocked(createApiKey).mockResolvedValueOnce({ ok: false, error: "That Card was not found." });

    const result = await executeTool("create_api_key", { name: "Bot", cardId: "nope" }, ctx);

    expect(result.summary).toBe("Couldn't create the key: That Card was not found.");
    expect(result.reveal).toBeUndefined();
  });

  it("create_api_key short-circuits on a missing name without hitting the db", async () => {
    const result = await executeTool("create_api_key", {}, ctx);

    expect(createApiKey).not.toHaveBeenCalled();
    expect(result.forModel).toEqual({ error: "Missing name." });
  });
});
