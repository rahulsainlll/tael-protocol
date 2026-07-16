import { CardGridSkeleton, PageHeaderSkeleton } from "../../../components/skeletons";

export default function Loading() {
  return (
    <>
      <PageHeaderSkeleton action />
      <CardGridSkeleton count={4} columns="sm:grid-cols-2" />
    </>
  );
}
