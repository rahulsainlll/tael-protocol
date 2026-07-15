import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";

export interface SetupStep {
  label: string;
  hint: string;
  done: boolean;
  /** Where the CTA for an incomplete step points. */
  href: string;
  cta: string;
}

/**
 * Guided setup for the home page. Renders the user's real progress through the
 * core loop (create an agent → run a capability → publish to earn) and points
 * at the next thing to do. The parent passes state-derived steps; this only
 * renders. Hidden entirely once every step is done (see the page).
 */
export function GettingStarted({ steps }: { steps: SetupStep[] }) {
  const done = steps.filter((s) => s.done).length;
  const nextIndex = steps.findIndex((s) => !s.done);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">Get started</CardTitle>
          <CardDescription>A few steps to your first agent payment.</CardDescription>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {done} of {steps.length}
        </span>
      </CardHeader>
      <CardContent className="space-y-1">
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          return (
            <div
              key={step.label}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors"
            >
              <span
                className={
                  step.done
                    ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                    : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-muted-foreground/30"
                }
              >
                {step.done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={
                    step.done
                      ? "text-sm text-muted-foreground line-through decoration-muted-foreground/40"
                      : "text-sm font-medium"
                  }
                >
                  {step.label}
                </p>
                {isNext ? <p className="text-xs text-muted-foreground">{step.hint}</p> : null}
              </div>
              {isNext ? (
                <Link
                  href={step.href}
                  className="group inline-flex shrink-0 items-center gap-1 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  {step.cta}
                  <ArrowRight className="h-3 w-3 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
