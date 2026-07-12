import { cn } from "@tael/ui";

/**
 * Tael wordmark — matches the marketing site (apps/web): a hand-drawn "t" in
 * the brand blue (Delicious Handrawn via --font-display) followed by "tael".
 */
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
