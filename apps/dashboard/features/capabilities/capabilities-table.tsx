"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Pencil, Search, Trash2 } from "lucide-react";
import { cn, Input } from "@tael/ui";
import { formatPrice, kindMeta, timeAgo } from "./kind-meta";
import { CapabilityLogo } from "./capability-logo";
import { DeleteCapabilityDialog } from "./delete-capability-dialog";
import type { CapabilityListItem } from "./list-item";

export function CapabilitiesTable({ items }: { items: CapabilityListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "verified" | "pending" | "draft">("all");
  const [pendingDelete, setPendingDelete] = useState<CapabilityListItem | null>(null);

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const matchesQuery =
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.slug.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = status === "all" || c.status === status;
        return matchesQuery && matchesStatus;
      }),
    [items, query, status],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search capabilities…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2.5 font-medium">Capability</th>
              <th className="px-4 py-2.5 font-medium">Type</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Price</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">FAQ</th>
              <th className="px-4 py-2.5 text-right font-medium">Created</th>
              <th className="px-4 py-2.5" aria-label="Actions" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => {
              const meta = kindMeta(c.kind);
              const Icon = meta.icon;
              return (
                <tr key={c.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/marketplace/${c.slug}`} className="flex items-center gap-3">
                      <CapabilityLogo
                        src={c.logoUrl}
                        name={c.name}
                        kind={c.kind}
                        className="h-9 w-9"
                      />
                      <span className="min-w-0 font-medium">{c.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold",
                        meta.badge,
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" /> {meta.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.status === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : c.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ${formatPrice(c.price)}{" "}
                    <span className="text-xs font-normal text-muted-foreground">USDC</span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {c.faqCount}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {timeAgo(c.createdAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/capabilities/${c.id}/edit`}
                        aria-label={`Edit ${c.name}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        type="button"
                        aria-label={`Delete ${c.name}`}
                        onClick={() => setPendingDelete(c)}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {items.length} capabilities
      </p>

      <DeleteCapabilityDialog item={pendingDelete} onClose={() => setPendingDelete(null)} />
    </div>
  );
}
