import { Star } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { PageHeader } from "../../../components/page-header";

export default function ReviewsPage() {
  return (
    <>
      <PageHeader
        title="Reviews"
        description="Ratings and trust scores agents leave for your capabilities."
      />
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Once agents use your capabilities, their ratings and reviews appear here."
      />
    </>
  );
}
