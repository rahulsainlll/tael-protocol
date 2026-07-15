import { Star } from "lucide-react";

/** Read-only star rating (supports halves via rounding for the average). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={
            i <= Math.round(value)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted text-muted-foreground/40"
          }
        />
      ))}
    </span>
  );
}
