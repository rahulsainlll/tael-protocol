import { PageSkeleton } from "../../components/skeletons";

// Instant loading state for every dashboard page: on nav the sidebar/topbar stay
// and this skeleton shows immediately while the (dynamic) page streams in.
export default function Loading() {
  return <PageSkeleton />;
}
