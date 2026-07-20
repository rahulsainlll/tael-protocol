import type { ReactNode } from "react";

/**
 * Editorial prose primitives for the blog — a dark, spacious reading experience
 * (inspired by animations.dev) on Tael's brand: near-black canvas, generous
 * line-height, serif italics for emphasis, and underlined (monochrome) links.
 */

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="text-[21px] leading-[1.7] tracking-[-0.01em] text-white/80 sm:text-[23px]">
      {children}
    </p>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-6 text-[18px] leading-[1.75] tracking-[-0.005em] text-white/65 sm:text-[19px]">
      {children}
    </p>
  );
}

/** Serif italic emphasis — the animations.dev "hard" treatment. */
export function Em({ children }: { children: ReactNode }) {
  return <em className="font-serif italic text-white/90">{children}</em>;
}

export function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-white">{children}</strong>;
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-16 scroll-mt-24 text-[26px] font-semibold tracking-[-0.02em] text-white sm:text-[30px]"
    >
      {children}
    </h2>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="font-medium text-white underline decoration-white/30 underline-offset-2 transition-colors hover:decoration-white"
    >
      {children}
    </a>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-6 flex list-disc flex-col gap-3 pl-6 text-[18px] leading-[1.7] tracking-[-0.005em] text-white/65 marker:text-white/30 sm:text-[19px]">
      {children}
    </ul>
  );
}

/** A pulled-out line for emphasis: centered, framed by hairline rules, with a
 *  muted lead and a white payoff (wrap the lead in a text-white/50 span). */
export function Pullquote({ children }: { children: ReactNode }) {
  return (
    <div className="my-14 border-y border-white/10 py-10 text-center">
      <p className="mx-auto max-w-[32ch] text-[24px] font-medium leading-[1.4] tracking-[-0.02em] text-white sm:text-[27px]">
        {children}
      </p>
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-white/80">
      {children}
    </code>
  );
}

/** A monospace block for a code sample — dark, framed, softly scrollable. */
export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="my-8 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-[13.5px] leading-[1.75] text-white/75 sm:text-[14px]">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

/** A subtle bordered aside for a note or definition. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="my-8 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-5 text-[16px] leading-[1.65] text-white/60">
      {children}
    </div>
  );
}
