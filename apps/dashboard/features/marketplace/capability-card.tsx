import { Star } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@tael/ui";
import type { SampleCapability } from "./sample-data";

export function CapabilityCard({ capability }: { capability: SampleCapability }) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{capability.name}</CardTitle>
          <Badge variant="secondary">{capability.category}</Badge>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{capability.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-3">
        <div className="flex items-center gap-1 text-sm">
          <Star className="h-3.5 w-3.5 fill-current text-yellow-500" />
          <span className="font-medium">{capability.rating.toFixed(1)}</span>
          <span className="text-muted-foreground">
            · {capability.successRate}% success · {capability.latencyMs}ms
          </span>
        </div>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">by {capability.creator}</span>
          <span className="text-sm font-semibold">
            ${capability.price}
            <span className="text-xs font-normal text-muted-foreground">/call</span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
