import type { ReactNode } from "react";
import { highlight } from "sugar-high";
import { CopyButton } from "./copy-button";

/** Shared shell for a written docs page: eyebrow + title + lead, article body,
 *  and the sticky "On this page" table of contents — matching the intro page. */
export function DocPage({
  eyebrow,
  title,
  lead,
  toc,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  toc?: { label: string; href: string }[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] gap-10 px-8 py-12">
      <article className="min-w-0 flex-1">
        <p className="text-[13px] font-medium tracking-[-0.01em] text-ink-muted dark:text-white/45">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-[38px] font-semibold leading-tight tracking-[-0.02em] text-ink dark:text-white">
          {title}
        </h1>
        <p className="mt-3 text-[18px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
          {lead}
        </p>
        <div className="mt-8">{children}</div>
      </article>

      {toc && toc.length > 0 ? (
        <aside className="sticky top-20 hidden h-max w-52 shrink-0 xl:block">
          <p className="mb-3 text-[13px] font-medium tracking-[-0.01em] text-ink-muted dark:text-white/45">
            On this page
          </p>
          <ul className="flex flex-col gap-1 border-l border-line dark:border-white/10">
            {toc.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="-ml-px block border-l-2 border-transparent py-1 pl-3 text-[13px] tracking-[-0.01em] text-ink-muted transition-colors hover:border-accent hover:text-black dark:text-white/45 dark:hover:text-white"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </div>
  );
}

/** Section heading with an anchor id (targets from the TOC). */
export function H2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-14 scroll-mt-20 text-[24px] font-semibold tracking-[-0.02em] text-ink first:mt-0 dark:text-white"
    >
      {children}
    </h2>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3
      id={id}
      className="mt-8 scroll-mt-20 text-[17px] font-semibold tracking-[-0.01em] text-ink dark:text-white"
    >
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
      {children}
    </p>
  );
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[15px] leading-7 tracking-[-0.01em] text-ink-soft marker:text-ink-muted dark:text-white/70 dark:marker:text-white/30">
      {children}
    </ul>
  );
}

/** Inline monospace token. */
export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md border border-line bg-surface/60 px-1.5 py-0.5 font-mono text-[13px] text-ink dark:border-white/10 dark:bg-white/[0.06] dark:text-white/80">
      {children}
    </code>
  );
}

/** Text link inside prose. */
export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="font-medium text-accent underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

/** Informational callout, matching the intro-page style. */
export function Callout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex gap-3 rounded-xl border border-line bg-surface/50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="mt-0.5 shrink-0 text-ink-muted dark:text-white/45"
        aria-hidden
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="text-[14px] leading-6 tracking-[-0.01em] text-ink-soft dark:text-white/65">
        {children}
      </div>
    </div>
  );
}

type Lang = "ts" | "tsx" | "js" | "json" | "bash";

const LANG_BADGE: Record<Lang, { label: string; className: string }> = {
  ts: { label: "TS", className: "bg-[#3178c6] text-white" },
  tsx: { label: "TSX", className: "bg-[#3178c6] text-white" },
  js: { label: "JS", className: "bg-[#f7df1e] text-black" },
  json: { label: "{ }", className: "bg-ink text-white dark:bg-white/15" },
  bash: { label: "›_", className: "bg-ink text-white dark:bg-white/15" },
};

const LANG_NAME: Record<Lang, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  json: "JSON",
  bash: "Terminal",
};

/** Best-effort language detection from the title, then the code content. */
function inferLang(code: string, title?: string): Lang {
  const t = (title ?? "").toLowerCase();
  if (t.endsWith(".tsx")) return "tsx";
  if (t.endsWith(".ts")) return "ts";
  if (t.endsWith(".js")) return "js";
  if (t.endsWith(".json")) return "json";
  if (t === "terminal" || t === "bash" || t === "shell") return "bash";
  const trimmed = code.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (/^(curl|pnpm|npm|yarn|npx|printf|export |[A-Z_]+=)/.test(trimmed)) return "bash";
  return "ts";
}

/** Fenced code block with a language badge, filename header, and copy button.
 *  Syntax is highlighted with sugar-high; token colors come from the --sh-* CSS
 *  variables in globals.css (light + dark palettes). */
export function CodeBlock({ title, code, lang }: { title?: string; code: string; lang?: Lang }) {
  const resolved = lang ?? inferLang(code, title);
  const badge = LANG_BADGE[resolved];
  const html = highlight(code);

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-line dark:border-white/10">
      <div className="flex items-center gap-2 border-b border-line bg-surface/50 pl-3 pr-2 dark:border-white/10 dark:bg-white/[0.03]">
        <span
          className={`flex h-5 min-w-[20px] items-center justify-center rounded px-1 text-[10px] font-bold leading-none ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="flex-1 truncate py-2 font-mono text-[12px] text-ink-muted dark:text-white/45">
          {title ?? LANG_NAME[resolved]}
        </span>
        <CopyButton code={code} />
      </div>
      <pre className="overflow-x-auto bg-white p-4 text-[13px] leading-6 dark:bg-[#0c0c0c]">
        <code
          className="font-mono [&_.sh__line]:block"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </pre>
    </div>
  );
}
