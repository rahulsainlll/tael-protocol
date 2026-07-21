"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType, PointerEvent as ReactPointerEvent } from "react";
import { RotateCcw, Rocket, ScanEye, ShieldCheck } from "lucide-react";
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

/** A node's position: x as a fraction of the canvas width (stays responsive),
 *  y in pixels. The tile is 48px; its centre is (fx·width, y + 24). */
interface Pos {
  fx: number;
  y: number;
}

const CANVAS_H = 236; // px — room to drag the nodes around
const TILE_HALF = 24;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** Evenly spread n nodes across the canvas at a comfortable resting height. */
function defaultPositions(n: number): Pos[] {
  return Array.from({ length: n }, (_, i) => ({
    fx: n > 1 ? 0.14 + (i / (n - 1)) * 0.72 : 0.5,
    y: 72,
  }));
}

/**
 * The capability's real publish → verify journey (Published → Under review →
 * Verified), tied to its actual status — not fabricated always-done stages.
 * The nodes are draggable: grab a tile and move it, and the connectors follow.
 * Tap a node (without dragging) to read what that stage means. Animations follow
 * Emil Kowalski's rules — transform/opacity only, ease-out, a mount-triggered
 * line fade + staggered entrance, a soft pulse on the in-flight step — all
 * disabled under reduced motion.
 */
export function VerificationTimeline({
  status,
  publishedLabel,
}: {
  status: "draft" | "pending" | "verified";
  publishedLabel: string;
}) {
  const verified = status === "verified";
  const canvasRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [openStep, setOpenStep] = useState<number | null>(verified ? 2 : 1);
  const [pos, setPos] = useState<Pos[]>(() => defaultPositions(3));
  const [moved, setMoved] = useState(false);
  // Tracks the in-flight pointer drag without re-rendering on every check.
  const drag = useRef<{ i: number; sx: number; sy: number; moved: boolean } | null>(null);

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

  function onPointerDown(e: ReactPointerEvent, i: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { i, sx: e.clientX, sy: e.clientY, moved: false };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const d = drag.current;
    const canvas = canvasRef.current;
    if (!d || !canvas) return;
    // Ignore sub-pixel jitter so a tap doesn't count as a drag.
    if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) return;
    d.moved = true;
    if (!moved) setMoved(true);
    const rect = canvas.getBoundingClientRect();
    const fx = clamp((e.clientX - rect.left) / rect.width, 0.07, 0.93);
    const y = clamp(e.clientY - rect.top - TILE_HALF, 8, rect.height - 104);
    setPos((prev) => prev.map((p, idx) => (idx === d.i ? { fx, y } : p)));
  }

  function onPointerUp(i: number) {
    const wasDrag = drag.current?.moved;
    drag.current = null;
    // A tap (no drag) toggles the step's detail.
    if (!wasDrag) setOpenStep((cur) => (cur === i ? null : i));
  }

  function reset() {
    setPos(defaultPositions(steps.length));
    setMoved(false);
  }

  return (
    <div>
      <div
        ref={canvasRef}
        className="relative touch-none overflow-hidden rounded-xl border"
        style={{
          height: CANVAS_H,
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "14px 14px",
          color: "rgb(120 120 120 / 0.14)",
        }}
      >
        {/* Connectors — SVG lines between node centres; they follow on drag. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500 ease-out"
          style={{ opacity: mounted ? 1 : 0 }}
        >
          {steps.slice(0, -1).map((step, i) => {
            const a = pos[i]!;
            const b = pos[i + 1]!;
            const filled = step.state === "done" && steps[i + 1]!.state !== "todo";
            return (
              <line
                key={i}
                x1={`${a.fx * 100}%`}
                y1={a.y + TILE_HALF}
                x2={`${b.fx * 100}%`}
                y2={b.y + TILE_HALF}
                strokeWidth={1.5}
                strokeLinecap="round"
                className={filled ? "stroke-emerald-500/40" : "stroke-border"}
              />
            );
          })}
        </svg>

        {/* Nodes — absolutely positioned, draggable, centred on their point. */}
        {steps.map((step, i) => {
          const Icon = step.icon;
          const p = pos[i]!;
          const open = openStep === i;
          return (
            <div
              key={step.label}
              className="absolute flex w-32 -translate-x-1/2 flex-col items-center gap-2.5 text-center"
              style={{ left: `${p.fx * 100}%`, top: p.y }}
            >
              <span
                onPointerDown={(e) => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={() => onPointerUp(i)}
                className={cn(
                  "relative z-10 flex h-12 w-12 cursor-grab touch-none select-none items-center justify-center rounded-xl border bg-background shadow-sm active:cursor-grabbing",
                  "transition-transform duration-150 ease-out hover:scale-105 active:scale-95",
                  "motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90",
                  open && "ring-2 ring-foreground/15 ring-offset-2 ring-offset-background",
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
                  "pointer-events-none rounded-md px-2.5 py-1 text-xs font-semibold duration-500 ease-out motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1",
                  PILL[step.state],
                )}
                style={{ animationDelay: `${i * 120 + 90}ms` }}
              >
                {step.label}
              </span>
              <span
                className="pointer-events-none text-xs text-muted-foreground duration-500 ease-out motion-safe:animate-in motion-safe:fade-in"
                style={{ animationDelay: `${i * 120 + 160}ms` }}
              >
                {step.subtitle}
              </span>
            </div>
          );
        })}

        {/* Affordance + reset — subtle, bottom corners. */}
        <span className="pointer-events-none absolute bottom-3 left-3 text-[11px] text-muted-foreground/70">
          Drag the steps · tap to read
        </span>
        {moved ? (
          <button
            type="button"
            onClick={reset}
            className="absolute bottom-2.5 right-3 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        ) : null}
      </div>

      {/* Detail for the selected step — expands under the canvas, animated. */}
      {openStep !== null && steps[openStep] ? (
        <div
          key={openStep}
          className="mt-3 flex items-start gap-2.5 rounded-lg border bg-background/70 p-3.5 text-sm text-muted-foreground duration-200 ease-out animate-in fade-in slide-in-from-top-1"
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
