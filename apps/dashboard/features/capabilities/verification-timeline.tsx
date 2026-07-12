import { BadgeCheck, Circle, FlaskConical, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@tael/ui";

type Tone = "neutral" | "blue" | "green";

interface TimelineStep {
  label: string;
  subtitle: string;
  icon: ComponentType<LucideProps>;
  tone: Tone;
  done: boolean;
}

const PILL: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  blue: "bg-blue-500/10 text-blue-600",
  green: "bg-emerald-500/10 text-emerald-700",
};

const ICON: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  blue: "text-blue-600",
  green: "text-emerald-600",
};

/**
 * Resend-style stepped progress for a capability's publish → verify journey.
 * Described → AI reviewed → Verified, on a dotted canvas with tile icons + pills.
 */
export function VerificationTimeline({ verified }: { verified: boolean }) {
  const steps: TimelineStep[] = [
    {
      label: "Endpoint tested",
      subtitle: "Live response captured",
      icon: FlaskConical,
      tone: "neutral",
      done: true,
    },
    { label: "AI reviewed", subtitle: "Response checked", icon: Sparkles, tone: "blue", done: true },
    {
      label: "Verified",
      subtitle: verified ? "Live in marketplace" : "Pending",
      icon: verified ? BadgeCheck : Circle,
      tone: verified ? "green" : "neutral",
      done: verified,
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
          return (
            <div key={step.label} className="relative flex flex-col items-center gap-2.5 text-center">
              {i < steps.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-1/2 top-6 -z-0 h-px w-full",
                    steps[i + 1]?.done ? "bg-emerald-500/30" : "bg-border",
                  )}
                />
              ) : null}
              <span
                className={cn(
                  "z-10 flex h-12 w-12 items-center justify-center rounded-xl border bg-background shadow-sm",
                  step.done ? "border-border" : "border-dashed",
                )}
              >
                <Icon className={cn("h-5 w-5", ICON[step.tone])} />
              </span>
              <span
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold",
                  PILL[step.tone],
                )}
              >
                {step.label}
              </span>
              <span className="text-xs text-muted-foreground">{step.subtitle}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
