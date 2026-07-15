import { Star } from "lucide-react";
import { canReview, getCapabilityReviews } from "./queries";
import { Stars } from "./stars";
import { ReviewForm } from "./review-form";

function truncate(addr: string): string {
  return addr.length > 14 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

function timeAgo(d: Date): string {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  for (const [sec, label] of [
    [86400, "d"],
    [3600, "h"],
    [60, "m"],
  ] as const) {
    if (s >= sec) return `${Math.floor(s / sec)}${label} ago`;
  }
  return "just now";
}

/** Reviews block for a capability page: average, the buyer's form, and the list. */
export async function ReviewsSection({
  capabilityId,
  slug,
}: {
  capabilityId: string;
  slug: string;
}) {
  const [summary, eligibility] = await Promise.all([
    getCapabilityReviews(capabilityId),
    canReview(capabilityId),
  ]);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          <Star className="h-4 w-4" /> Reviews
        </h2>
        {summary.count > 0 ? (
          <span className="flex items-center gap-1.5 text-sm">
            <Stars value={summary.average} />
            <span className="font-medium tabular-nums">{summary.average.toFixed(1)}</span>
            <span className="text-muted-foreground">
              ({summary.count} review{summary.count === 1 ? "" : "s"})
            </span>
          </span>
        ) : null}
      </div>

      {eligibility.canReview ? <ReviewForm capabilityId={capabilityId} slug={slug} /> : null}

      {summary.count === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No reviews yet. Buyers can rate this capability after paying for a call.
        </p>
      ) : (
        <div className="divide-y rounded-xl border">
          {summary.reviews.map((r) => (
            <div key={r.id} className="space-y-1.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {truncate(r.reviewer)}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              {r.comment ? <p className="text-sm text-foreground/90">{r.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
