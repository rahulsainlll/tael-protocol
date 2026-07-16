/**
 * Format a USDC amount for display. Keeps precision for micro-amounts (< $1),
 * since Tael runs on fractions-of-a-cent payments — rounding those to 2 decimals
 * would show a funded card as "$0.00".
 */
export function formatUsdc(value: string | number): string {
  const n = Number(value) || 0;
  const max = n !== 0 && Math.abs(n) < 1 ? 7 : 2;
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: max });
}
