// Catch-all for docs pages that aren't written yet. Renders inside the docs
// layout (sidebar + nav stay), so the clicked item stays highlighted.
export default function DocsComingSoonPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] px-8 py-24">
      <div className="mx-auto max-w-md text-center">
        <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink-muted dark:text-white/45">
          Coming soon
        </span>
        <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.02em] text-ink dark:text-white">
          We&apos;re writing this page.
        </h1>
        <p className="mt-3 text-[15px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
          This part of the docs isn&apos;t ready yet. Check back soon, or head back to the
          introduction.
        </p>
        <a
          href="/docs"
          className="mt-7 inline-block rounded-full bg-black px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
        >
          Back to Introduction
        </a>
      </div>
    </div>
  );
}
