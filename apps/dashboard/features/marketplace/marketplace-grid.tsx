"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { cn, Input } from "@tael/ui";
import { CapabilityCard } from "./capability-card";
import { categories, sampleCapabilities, type CapabilityCategory } from "./sample-data";

type Filter = CapabilityCategory | "All";

export function MarketplaceGrid() {
  const [active, setActive] = useState<Filter>("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      sampleCapabilities.filter((capability) => {
        const matchesCategory = active === "All" || capability.category === active;
        const matchesQuery = capability.name.toLowerCase().includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [active, query],
  );

  const filters: Filter[] = ["All", ...categories];

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search capabilities"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active === filter
                ? "border-transparent bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} />
        ))}
      </div>
    </div>
  );
}
