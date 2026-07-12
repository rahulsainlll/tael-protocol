const TOC = [
  { label: "Quickstart", href: "#quickstart" },
  { label: "Explore", href: "#explore" },
];

const QUICKSTART = [
  { title: "Node.js", desc: "Wrap an API and get paid in USDC." },
  { title: "Next.js", desc: "Add pay-per-call routes to your app." },
  { title: "Python", desc: "Meter and monetize your endpoints." },
  { title: "MCP", desc: "Charge agents for MCP tool calls." },
  { title: "cURL", desc: "Call the HTTP API directly." },
  { title: "x402", desc: "Accept x402 payment proofs." },
];

const EXPLORE = [
  { title: "Accept payments", desc: "Take USDC on Stellar from any agent, non-custodially." },
  { title: "Agent wallets", desc: "Provision and manage wallets your agents pay from." },
  { title: "Webhooks", desc: "React to payments and settlement events in real time." },
];

export default function DocsIntroPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1180px] gap-10 px-8 py-12">
      {/* Content */}
      <article className="min-w-0 flex-1">
        <p className="text-[13px] font-medium tracking-[-0.01em] text-ink-muted dark:text-white/45">
          Get started
        </p>
        <h1 className="mt-2 text-[38px] font-semibold leading-tight tracking-[-0.02em] text-ink dark:text-white">
          Introduction
        </h1>
        <p className="mt-3 text-[18px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
          Tael is the payment layer for autonomous AI agents.
        </p>

        {/* Callout */}
        <div className="mt-8 flex gap-3 rounded-xl border border-line bg-surface/50 px-5 py-4 dark:border-white/10 dark:bg-white/[0.04]">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className="mt-0.5 shrink-0 text-ink-muted dark:text-white/45"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 11v5M12 8h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-[14px] leading-6 tracking-[-0.01em] text-ink-soft dark:text-white/65">
            Wrap any API, MCP tool, or data service with one SDK call and get paid in USDC on
            Stellar every time an agent uses it. Non-custodial, no accounts required.
          </p>
        </div>

        {/* Quickstart */}
        <h2
          id="quickstart"
          className="mt-14 scroll-mt-20 text-[24px] font-semibold tracking-[-0.02em] text-ink dark:text-white"
        >
          Quickstart
        </h2>
        <p className="mt-2 text-[15px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
          Learn how to get Tael set up in your project.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICKSTART.map((card) => (
            <a
              key={card.title}
              href="#"
              className="group rounded-xl border border-line bg-white p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-colors hover:border-ink-muted/40 dark:border-white/10 dark:bg-white/[0.02] dark:shadow-none dark:hover:border-white/25"
            >
              <div className="mb-8 flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-[13px] font-semibold text-ink dark:bg-white/[0.08] dark:text-white">
                {card.title.slice(0, 2)}
              </div>
              <p className="text-[15px] font-semibold tracking-[-0.01em] text-ink dark:text-white">
                {card.title} Quickstart
              </p>
              <p className="mt-1 text-[13px] leading-5 tracking-[-0.01em] text-ink-muted dark:text-white/45">
                {card.desc}
              </p>
            </a>
          ))}
        </div>

        {/* Explore */}
        <h2
          id="explore"
          className="mt-14 scroll-mt-20 text-[24px] font-semibold tracking-[-0.02em] text-ink dark:text-white"
        >
          Explore
        </h2>
        <p className="mt-2 text-[15px] leading-7 tracking-[-0.01em] text-ink-soft dark:text-white/70">
          Dig into the core building blocks of the platform.
        </p>
        <div className="mt-6 flex flex-col divide-y divide-line rounded-xl border border-line dark:divide-white/10 dark:border-white/10">
          {EXPLORE.map((row) => (
            <a
              key={row.title}
              href="#"
              className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface/50 dark:hover:bg-white/[0.04]"
            >
              <div>
                <p className="text-[15px] font-medium tracking-[-0.01em] text-ink dark:text-white">
                  {row.title}
                </p>
                <p className="mt-0.5 text-[13px] tracking-[-0.01em] text-ink-muted dark:text-white/45">
                  {row.desc}
                </p>
              </div>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="text-ink-muted dark:text-white/45"
                aria-hidden
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          ))}
        </div>
      </article>

      {/* On this page */}
      <aside className="sticky top-20 hidden h-max w-52 shrink-0 xl:block">
        <p className="mb-3 text-[13px] font-medium tracking-[-0.01em] text-ink-muted dark:text-white/45">
          On this page
        </p>
        <ul className="flex flex-col gap-1 border-l border-line dark:border-white/10">
          {TOC.map((item) => (
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
    </div>
  );
}
