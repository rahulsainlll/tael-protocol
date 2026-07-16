import { cn } from "@tael/ui";
import { formatUsdc } from "../../lib/format";

// A small, curated set of premium dark gradients (black + blue-led). Each card
// keeps a stable one, so they vary but always look good.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #1e3a8a 0%, #0b1220 100%)", // navy blue
  "linear-gradient(135deg, #18181b 0%, #050506 100%)", // black
  "linear-gradient(135deg, #1d4ed8 0%, #0a1633 100%)", // royal blue
  "linear-gradient(135deg, #1f2937 0%, #030712 100%)", // graphite
  "linear-gradient(135deg, #0b2540 0%, #05101f 100%)", // deep ocean
] as const;

/** Deterministically pick a premium gradient; navy when there's no seed (preview). */
function cardGradient(seed?: string | null): string {
  if (!seed) return CARD_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return CARD_GRADIENTS[hash % CARD_GRADIENTS.length]!;
}

/** Mask a Stellar address into a card-number look: GDYQ •••• •••• NM55P. */
function cardNumber(address?: string | null): string {
  if (!address) return "•••• •••• •••• ••••";
  return `${address.slice(0, 4)} •••• •••• ${address.slice(-5)}`;
}

/**
 * A tiny card-shaped swatch in the Card's gradient — the card's identity at a
 * glance, for inline use in dense rows/chips where a full CardVisual is too big.
 */
export function CardSwatch({
  address,
  className,
}: {
  address?: string | null;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block h-5 w-8 shrink-0 rounded-[5px] shadow-sm ring-1 ring-inset ring-white/10",
        className,
      )}
      style={{ background: cardGradient(address) }}
    />
  );
}

/**
 * A Card rendered as a real payment card: gradient body, balance, the wallet
 * address styled like a card number, and the spending limits. Presentational.
 * With `preview`, it's a live template (no address yet) that fills in as a form
 * is typed — used in the create dialog.
 */
export function CardVisual({
  name,
  address,
  usdc = "0",
  policy,
  ready = false,
  preview = false,
  compact = false,
  className,
}: {
  name: string;
  address?: string | null;
  usdc?: string;
  policy: { maxPerCall: string; dailyLimit: string } | null;
  ready?: boolean;
  preview?: boolean;
  /** A small, balance-free variant — the card's identity, for inline use. */
  compact?: boolean;
  className?: string;
}) {
  if (compact) {
    return (
      <div
        className={cn(
          "relative flex aspect-[1.62/1] w-44 shrink-0 flex-col justify-between overflow-hidden rounded-xl p-3 text-white shadow-sm",
          className,
        )}
        style={{ background: cardGradient(address) }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />
        <span className="relative flex items-center gap-1 text-xs font-semibold tracking-wide">
          <span className="text-sm leading-none" style={{ fontFamily: "var(--font-display)" }}>
            t
          </span>
          tael
        </span>
        <div className="relative">
          <p className="font-mono text-[10px] tracking-widest text-white/80">
            {cardNumber(address)}
          </p>
          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide">
            {name || "Card"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex aspect-[1.62/1] w-full flex-col justify-between overflow-hidden rounded-2xl p-5 text-white shadow-md transition-[background] duration-300",
        className,
      )}
      style={{ background: cardGradient(preview ? null : address) }}
    >
      {/* Depth + sheen */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/25" />
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }}
      />

      <div className="relative flex items-start justify-between">
        <span className="flex items-center gap-1 text-sm font-semibold tracking-wide">
          <span className="text-lg leading-none" style={{ fontFamily: "var(--font-display)" }}>
            t
          </span>
          tael
        </span>
        {preview ? (
          <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur">
            New
          </span>
        ) : (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur",
              ready ? "bg-white/20" : "bg-amber-400/25 text-amber-50",
            )}
          >
            {ready ? "Ready" : "Not ready"}
          </span>
        )}
      </div>

      <div className="relative">
        <p className="text-2xl font-semibold tabular-nums">
          ${formatUsdc(usdc)} <span className="text-sm font-normal text-white/70">USDC</span>
        </p>
        <p className="mt-1 font-mono text-xs tracking-widest text-white/85">
          {cardNumber(address)}
        </p>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span className="min-w-0 truncate text-sm font-medium uppercase tracking-wide">
          {name || <span className="text-white/50">Card name</span>}
        </span>
        {policy && (policy.maxPerCall || policy.dailyLimit) ? (
          <span className="shrink-0 text-right text-[11px] leading-tight text-white/80">
            max ${policy.maxPerCall || "0"}/call
            <br />${policy.dailyLimit || "0"}/day
          </span>
        ) : null}
      </div>
    </div>
  );
}
