import { cn } from "@tael/ui";

export function TaelLogo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span
        className="text-[22px] leading-none text-[#156DFC]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        t
      </span>
      <span className="text-[20px] font-medium tracking-[0.01em] text-foreground">tael</span>
    </span>
  );
}

export function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-[#156DFC] to-indigo-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      Beta
    </span>
  );
}
