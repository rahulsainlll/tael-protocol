"use client";

import { useState } from "react";
import { cn } from "@tael/ui";
import { kindMeta } from "./kind-meta";

/**
 * A capability's brand mark: the publisher's logo when set, otherwise the kind
 * tile + icon (so listings without a logo keep the existing look). Falls back to
 * the tile if the image fails to load, so a broken URL never leaves a gap.
 *
 * Takes the plain `kind` string (not an icon component) so it stays serializable
 * when rendered by a server component.
 */
export function CapabilityLogo({
  src,
  name,
  kind,
  className,
  iconClassName = "h-4 w-4",
}: {
  src?: string | null;
  name: string;
  /** Capability kind, used to resolve the fallback icon + tile. */
  kind: string;
  /** Sizing classes, e.g. "h-9 w-9". */
  className?: string;
  /** Fallback icon size, matched to the tile size. */
  iconClassName?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (src && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary publisher URLs; next/image needs allow-listed hosts
      <img
        src={src}
        alt={name}
        onError={() => setErrored(true)}
        className={cn("shrink-0 rounded-lg border object-cover", className)}
      />
    );
  }

  const meta = kindMeta(kind);
  const Icon = meta.icon;
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-lg", meta.tile, className)}
    >
      <Icon className={iconClassName} />
    </span>
  );
}
