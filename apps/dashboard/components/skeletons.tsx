import { Skeleton } from "@tael/ui";

/** Matches the PageHeader (title + description, optional action). */
export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b pb-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action ? <Skeleton className="h-9 w-32 shrink-0" /> : null}
    </div>
  );
}

/** A grid of card-shaped placeholders (marketplace, agents, wallet, etc.). */
export function CardGridSkeleton({
  count = 6,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  count?: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-5">
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A row of stat-card placeholders (overview, analytics, payments). */
export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border p-5">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Generic dashboard page fallback: header + a content grid. */
export function PageSkeleton() {
  return (
    <>
      <PageHeaderSkeleton action />
      <CardGridSkeleton />
    </>
  );
}
