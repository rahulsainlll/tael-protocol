"use client";

import type { ReactNode } from "react";

/**
 * Renders a button that scrolls the hero email field into view and focuses it,
 * surfacing the input's active (ring) state. Used by both the nav CTA and the
 * footer "Try now" link.
 */
export function WaitlistTrigger({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const input = document.getElementById("waitlist-email") as HTMLInputElement | null;
        if (!input) return;
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus({ preventScroll: true });
      }}
    >
      {children}
    </button>
  );
}
