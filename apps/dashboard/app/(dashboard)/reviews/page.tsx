import { Star } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";
import { listMyReviews } from "../../../features/reviews/queries";
import { Stars } from "../../../features/reviews/stars";

export const dynamic = "force-dynamic";

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

export default async function ReviewsPage() {
  const reviews = await listMyReviews();

  return (
    <>
      <PageHeader title="Reviews" description="Reviews you've left on capabilities you've used." />
      {reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews yet"
          description="After an agent pays for a capability, you can rate it from the capability page. Your reviews show up here."
        />
      ) : (
        <div className="divide-y rounded-xl border">
          {reviews.map((r) => (
            <div key={r.id} className="space-y-1.5 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium">{r.capability}</span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
              </div>
              {r.comment ? <p className="text-sm text-muted-foreground">{r.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
