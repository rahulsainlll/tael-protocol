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
        // Only scroll if the input isn't already visible (e.g. clicked from the
        // footer). When it's on-screen (hero), just focus — no jump.
        const rect = input.getBoundingClientRect();
        const visible = rect.top >= 48 && rect.bottom <= window.innerHeight;
        if (!visible) {
          // Scroll the WINDOW to the very top so the whole hero is in view (not
          // scrollIntoView, which also scrolls the hero's overflow-hidden
          // container and leaves it stuck with no scrollbar to undo it).
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        // preventScroll stops focus from scrolling the overflow-hidden hero.
        input.focus({ preventScroll: true });
      }}
    >
      {children}
    </button>
  );
}
