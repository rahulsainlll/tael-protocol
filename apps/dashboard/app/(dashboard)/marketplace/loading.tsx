import { Skeleton } from "@tael/ui";
import { CardGridSkeleton, PageHeaderSkeleton } from "../../../components/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="space-y-4">
        <Skeleton className="h-11 w-full max-w-xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
      </div>
      <CardGridSkeleton />
    </>
  );
}
