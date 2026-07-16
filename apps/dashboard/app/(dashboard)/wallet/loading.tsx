import { CardGridSkeleton, PageHeaderSkeleton } from "../../../components/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton />
      <CardGridSkeleton count={2} columns="lg:grid-cols-2" />
    </>
  );
}
