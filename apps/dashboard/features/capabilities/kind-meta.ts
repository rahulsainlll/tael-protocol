import {
  Blocks,
  Bot,
  BrainCircuit,
  Braces,
  Database,
  Landmark,
  type LucideIcon,
} from "lucide-react";

/** Icon + color styling per capability kind, for consistent, lively UI. */
export interface KindMeta {
  icon: LucideIcon;
  label: string;
  /** Badge classes (bg + text + border). */
  badge: string;
  /** Icon-tile classes (bg + text). */
  tile: string;
}

export const KIND_META: Record<string, KindMeta> = {
  api: {
    icon: Braces,
    label: "API",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    tile: "bg-blue-500/10 text-blue-600",
  },
  mcp: {
    icon: Blocks,
    label: "MCP",
    badge: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    tile: "bg-purple-500/10 text-purple-600",
  },
  agent: {
    icon: Bot,
    label: "Agent",
    badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    tile: "bg-emerald-500/10 text-emerald-600",
  },
  model: {
    icon: BrainCircuit,
    label: "Model",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    tile: "bg-amber-500/10 text-amber-600",
  },
  dataset: {
    icon: Database,
    label: "Dataset",
    badge: "bg-pink-500/10 text-pink-600 border-pink-500/20",
    tile: "bg-pink-500/10 text-pink-600",
  },
  // TrustLine's kind: a metered read against an underwriting API, not a
  // third-party proxy — see TRUSTLINE_INTEGRATION.md for why this fits the
  // existing per-call-price gateway model unmodified.
  credit: {
    icon: Landmark,
    label: "Credit",
    badge: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    tile: "bg-teal-500/10 text-teal-600",
  },
};

export function kindMeta(kind: string): KindMeta {
  return (
    KIND_META[kind] ?? {
      icon: Braces,
      label: kind.toUpperCase(),
      badge: "bg-muted text-muted-foreground border-border",
      tile: "bg-muted text-muted-foreground",
    }
  );
}

/** Trim trailing zeros from a decimal price string: "0.0200000" → "0.02". */
export function formatPrice(price: string): string {
  if (!price.includes(".")) return price;
  return price.replace(/0+$/, "").replace(/\.$/, "");
}

/** Compact relative time, e.g. "3h ago", "2d ago". */
export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
    [Number.POSITIVE_INFINITY, "y"],
  ];
  let value = seconds;
  let unit = "s";
  for (const [div, u] of units) {
    if (value < div) {
      unit = u;
      break;
    }
    value = Math.floor(value / div);
    unit = u;
  }
  return value <= 0 ? "just now" : `${value}${unit} ago`;
}
