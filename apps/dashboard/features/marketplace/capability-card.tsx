import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, cn } from "@tael/ui";
import { formatPrice, kindMeta } from "../capabilities/kind-meta";
import { CapabilityLogo } from "../capabilities/capability-logo";
import type { MarketplaceItem } from "./types";

export function CapabilityCard({ capability }: { capability: MarketplaceItem }) {
  const meta = kindMeta(capability.kind);
  return (
    <Link href={`/marketplace/${capability.slug}`} className="group block">
      <Card className="flex h-full flex-col transition-[border-color,box-shadow,transform] duration-150 ease-out group-hover:border-foreground/20 group-hover:shadow-sm group-active:scale-[0.99]">
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <CapabilityLogo
              src={capability.logoUrl}
              name={capability.name}
              kind={capability.kind}
              className="h-9 w-9"
            />
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
            <span className="truncate font-mono text-xs text-muted-foreground">
              /{capability.slug}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              ${formatPrice(capability.price)}
              <span className="text-xs font-normal text-muted-foreground">USDC/call</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
