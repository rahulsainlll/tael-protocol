"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@tael/ui";
import type { ActivityRow } from "./queries";

const PAGE = 12;

function money(v: string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

function truncate(addr: string): string {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  for (const [sec, label] of [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ] as const) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "just now";
}

/** Payment activity list that reveals in pages instead of dumping everything. */
export function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  const [shown, setShown] = useState(PAGE);
  const visible = rows.slice(0, shown);
  const remaining = rows.length - shown;

  return (
    <div className="space-y-3">
      <div className="divide-y rounded-xl border">
        {visible.map((row) => (
          <ActivityItem key={row.id} row={row} />
        ))}
      </div>
      {remaining > 0 ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShown((n) => n + PAGE)}
            className="transition-transform duration-100 ease-out active:scale-[0.97]"
          >
            Load {Math.min(remaining, PAGE)} more
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ActivityItem({ row }: { row: ActivityRow }) {
  const earned = row.direction === "earned";
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/30">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          earned ? "bg-emerald-500/10" : "bg-muted"
        }`}
      >
        {earned ? (
          <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.capability}</p>
        <p className="truncate font-mono text-xs text-muted-foreground">
          {earned ? "from" : "to"} {truncate(row.counterparty)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-semibold tabular-nums ${
            earned ? "text-emerald-600" : "text-foreground"
          }`}
        >
          {earned ? "+" : "−"}${money(row.amount)}
        </p>
        <p className="text-xs tabular-nums text-muted-foreground">{timeAgo(row.createdAt)}</p>
      </div>
    </div>
  );
}
