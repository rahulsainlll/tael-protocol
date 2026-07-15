"use client";

import { useState } from "react";
import type { DayPoint } from "./queries";

type Metric = "earned" | "spent" | "calls";

function value(p: DayPoint, m: Metric): number {
  return m === "earned" ? p.earned : m === "spent" ? p.spent : p.calls;
}

function label(p: DayPoint, m: Metric): string {
  const v = value(p, m);
  if (m === "calls") return `${v} call${v === 1 ? "" : "s"}`;
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 7 })}`;
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * A dependency-free daily bar chart. Bars grow with a short ease-out on mount and
 * lighten on hover, showing a value/date tooltip. Empty series render flat.
 */
export function BarChart({
  data,
  metric,
  color,
}: {
  data: DayPoint[];
  metric: Metric;
  color: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map((p) => value(p, metric)), 0);

  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]">
        {data.map((p, i) => {
          const v = value(p, metric);
          const pct = max > 0 ? (v / max) * 100 : 0;
          return (
            <button
              key={p.date}
              type="button"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="group relative flex h-full flex-1 items-end"
              aria-label={`${dayLabel(p.date)}: ${label(p, metric)}`}
            >
              <span
                className={`w-full rounded-sm transition-[height,opacity] duration-300 ease-out ${
                  hover === i ? "opacity-100" : "opacity-80"
                }`}
                style={{ height: `${Math.max(pct, v > 0 ? 4 : 1.5)}%`, backgroundColor: color }}
              />
              {hover === i ? (
                <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-background px-2 py-1 text-xs shadow-md">
                  <span className="font-medium tabular-nums">{label(p, metric)}</span>
                  <span className="ml-1.5 text-muted-foreground">{dayLabel(p.date)}</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{dayLabel(data[0]?.date ?? "")}</span>
        <span>{dayLabel(data[data.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}
