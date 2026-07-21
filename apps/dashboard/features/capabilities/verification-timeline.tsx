"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Rocket, ScanEye, ShieldCheck } from "lucide-react";
import type { LucideProps } from "lucide-react";
import { cn } from "@tael/ui";

type State = "done" | "active" | "todo";

interface Step {
  label: string;
  subtitle: string;
  detail: string;
  icon: ComponentType<LucideProps>;
  state: State;
}

const TILE: Record<State, string> = {
  done: "border-emerald-500/30 text-emerald-600",
  active: "border-blue-500/40 text-blue-600",
  todo: "border-dashed border-border text-muted-foreground",
};
const PILL: Record<State, string> = {
  done: "bg-emerald-500/10 text-emerald-700",
  active: "bg-blue-500/10 text-blue-600",
  todo: "bg-muted text-muted-foreground",
};

/**
 * The capability's real publish → verify journey, tied to its actual status
 * (`pending` | `verified`), not fabricated stages. Published is always reached;
 * "Under review" is the manual Tael review; "Verified" turns green only once
 * Tael grants the badge. Animations follow Emil Kowalski's rules: transform +
 * opacity only, ease-out, a mount-triggered line draw and a staggered entrance,
 * a gentle pulse on the in-flight step — all disabled under reduced motion.
 */
export function VerificationTimeline({
  status,
  publishedLabel,
}: {
  status: "draft" | "pending" | "verified";
  publishedLabel: string;
}) {
  const verified = status === "verified";
  const [mounted, setMounted] = useState(false);
  // Which step's detail is open. Defaults to the current stage (the active one,
  // else the last done one) so there's something to read without a click.
  const [openStep, setOpenStep] = useState<number | null>(verified ? 2 : 1);
  // Flip on the next frame so the line fill + entrances animate from their
  // initial state instead of rendering already-complete.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const steps: Step[] = [
    {
      label: "Published",
      subtitle: `Live ${publishedLabel}`,
      detail: "Your endpoint is live in the marketplace and any agent can call it.",
      icon: Rocket,
      state: "done",
    },
    {
      label: "Under review",
      subtitle: verified ? "Reviewed by Tael" : "Tael is reviewing",
      detail: verified
        ? "Tael reviewed the capability and confirmed it responds correctly and is safe to call."
        : "Tael is checking that the capability responds correctly and is safe before granting trust.",
      icon: ScanEye,
      state: verified ? "done" : "active",
    },
    {
      label: verified ? "Verified" : "Not yet verified",
      subtitle: verified ? "Trusted and live" : "Awaiting the Tael badge",
      detail: verified
        ? "Tael granted the trust badge — buyers see this capability as verified."
        : "It works and can be called, but hasn't received the Tael trust badge yet.",
      icon: ShieldCheck,
      state: verified ? "done" : "todo",
    },
  ];

  return (
    <div
      className="rounded-xl border p-8"
      style={{
        backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
        backgroundSize: "14px 14px",
        color: "rgb(120 120 120 / 0.14)",
      }}
    >
      <div className="grid grid-cols-3 items-start gap-2 text-foreground">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const next = steps[i + 1];
          // The connector to the next node fills once this node is done and the
          // next one has been reached (done or active).
          const filled = step.state === "done" && next && next.state !== "todo";
          const isOpen = openStep === i;
          return (
            <button
              key={step.label}
              type="button"
              onClick={() => setOpenStep(isOpen ? null : i)}
              className="group relative flex flex-col items-center gap-2.5 text-center outline-none"
            >
              {/* Connector: a grey track with an emerald fill that draws in. */}
              {next ? (
                <span className="absolute left-1/2 top-6 -z-0 h-px w-full overflow-hidden bg-border">
                  <span
                    className="block h-full w-full origin-left bg-emerald-500/40 transition-transform duration-700 ease-out motion-reduce:transition-none"
                    style={{
                      transform: mounted && filled ? "scaleX(1)" : "scaleX(0)",
                      transitionDelay: `${i * 180 + 260}ms`,
                    }}
                  />
                </span>
              ) : null}

              {/* Icon tile — staggered entrance; hover/press feedback; selected ring. */}
              <span
                className={cn(
                  "relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm",
                  "transition-transform duration-150 ease-out group-hover:scale-105 group-active:scale-95",
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90",
                  isOpen && "ring-2 ring-foreground/15 ring-offset-2 ring-offset-background",
                  TILE[step.state],
                )}
                style={{ animationDelay: `${i * 120}ms` }}
              >
                {step.state === "active" ? (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-blue-500/25 motion-safe:animate-pulse" />
                ) : null}
                <Icon className="relative h-5 w-5" />
              </span>

              <span
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold duration-500 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
                  PILL[step.state],
                )}
                style={{ animationDelay: `${i * 120 + 90}ms` }}
              >
                {step.label}
              </span>
              <span
                className="text-xs text-muted-foreground duration-500 ease-out motion-safe:animate-in motion-safe:fade-in"
                style={{ animationDelay: `${i * 120 + 160}ms` }}
              >
                {step.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detail for the selected step — expands under the row, animated. */}
      {openStep !== null && steps[openStep] ? (
        <div
          key={openStep}
          className="mt-6 flex items-start gap-2.5 rounded-lg border bg-background/70 p-3.5 text-sm text-muted-foreground duration-200 ease-out animate-in fade-in slide-in-from-top-1"
        >
          <span
            className={cn(
              "mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full",
              steps[openStep]!.state === "done"
                ? "bg-emerald-500"
                : steps[openStep]!.state === "active"
                  ? "bg-blue-500"
                  : "bg-muted-foreground/40",
            )}
          />
          <p>
            <span className="font-medium text-foreground">{steps[openStep]!.label}.</span>{" "}
            {steps[openStep]!.detail}
          </p>
        </div>
      ) : null}
    </div>
  );
}
