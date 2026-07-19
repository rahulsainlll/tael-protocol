import { describe, expect, it, vi } from "vitest";

vi.mock("./capabilities", () => ({
  searchCapabilities: vi.fn(),
  getCapabilityBySlug: vi.fn(),
}));

import { searchCapabilities, getCapabilityBySlug } from "./capabilities";
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
});
