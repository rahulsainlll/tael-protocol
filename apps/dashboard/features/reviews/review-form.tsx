"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Button } from "@tael/ui";
import { submitReview } from "./actions";

/** Inline form for a buyer to leave a rating + optional comment. */
export function ReviewForm({ capabilityId, slug }: { capabilityId: string; slug: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitReview({ capabilityId, slug, rating, comment });
      if (res.ok) router.refresh();
      else setError(res.error ?? "Could not save.");
    });
  }

  return (
    <div className="space-y-3 rounded-xl border p-4">
      <p className="text-sm font-medium">Leave a review</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(i)}
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
            className="rounded p-0.5 transition-transform duration-100 ease-out active:scale-90"
          >
            <Star
              className={
                i <= (hover || rating)
                  ? "h-6 w-6 fill-amber-400 text-amber-400"
                  : "h-6 w-6 fill-muted text-muted-foreground/40"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Share how it worked (optional)…"
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button
        size="sm"
        onClick={submit}
        disabled={pending || rating === 0}
        className="transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        {pending ? "Saving…" : "Submit review"}
      </Button>
    </div>
  );
}
