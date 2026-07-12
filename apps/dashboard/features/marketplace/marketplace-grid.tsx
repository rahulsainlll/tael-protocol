"use client";

import { useMemo, useState } from "react";
import { Search, Store } from "lucide-react";
import { cn, Input } from "@tael/ui";
import { EmptyState } from "../../components/empty-state";
import { CapabilityCard } from "./capability-card";
import { capabilityKinds, type MarketplaceItem } from "./types";

type Filter = MarketplaceItem["kind"] | "all";

export function MarketplaceGrid({ items }: { items: MarketplaceItem[] }) {
  const [active, setActive] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesKind = active === "all" || item.kind === active;
        const matchesQuery = item.name.toLowerCase().includes(query.toLowerCase());
        return matchesKind && matchesQuery;
      }),
    [items, active, query],
  );

  const filters: Filter[] = ["all", ...capabilityKinds];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Store}
        title="No capabilities yet"
        description="The marketplace is empty. Publish the first capability from “My Capabilities”."
      />
    );
  }

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
              "rounded-full border px-3 py-1 text-xs font-medium uppercase transition-colors",
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
        {filtered.map((item) => (
          <CapabilityCard key={item.id} capability={item} />
        ))}
      </div>
    </div>
  );
}
