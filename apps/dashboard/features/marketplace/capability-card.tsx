import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, cn } from "@tael/ui";
import { formatPrice, kindMeta } from "../capabilities/kind-meta";
import type { MarketplaceItem } from "./types";

export function CapabilityCard({ capability }: { capability: MarketplaceItem }) {
  const meta = kindMeta(capability.kind);
  const Icon = meta.icon;
  return (
    <Link href={`/marketplace/${capability.slug}`} className="group block">
      <Card className="flex h-full flex-col transition-colors group-hover:border-foreground/20">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", meta.tile)}>
              <Icon className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                meta.badge,
              )}
            >
              {meta.label}
            </span>
          </div>
          <CardTitle className="flex items-center gap-1.5 text-base">
            {capability.name}
            {capability.status === "verified" ? (
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            ) : null}
          </CardTitle>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {capability.description || "No description."}
          </p>
        </CardHeader>
        <CardContent className="mt-auto">
          <div className="flex items-center justify-between border-t pt-3">
            <span className="font-mono text-xs text-muted-foreground">/{capability.slug}</span>
            <span className="text-sm font-semibold">
              ${formatPrice(capability.price)}
              <span className="text-xs font-normal text-muted-foreground">/call</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
