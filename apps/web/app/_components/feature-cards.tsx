/* eslint-disable @next/next/no-img-element */

/** Tael's four best things. Each card is an illustration (upper half) + copy
 *  (lower half) that links to the doc. `image` is a placeholder (/pic.png) shown
 *  faded until real art is dropped in; set `real: true` for finished art/logos. */
const CARDS: {
  title: string;
  body: string;
  href: string;
  image: string;
  alt: string;
  real?: boolean;
}[] = [
  {
    title: "One API for every capability",
    body: "Call any API, tool, or data source through a single interface — one key, one line of code.",
    href: "/docs/call-a-capability",
    image: "/pic.png",
    alt: "Many capabilities converging into one interface",
  },
  {
    title: "Pay per call in USDC",
    body: "No accounts, no subscriptions. Every call settles in USDC on Stellar, in the same request.",
    href: "/docs/accept-payments",
    image: "/pic.png",
    alt: "A single request carrying a USDC payment",
  },
  {
    title: "Agent-native, with caps",
    body: "The agent pays from its own funded card, within the limits you set. A leaked key can't drain you.",
    href: "/docs/authentication",
    image: "/pic.png",
    alt: "An AI agent with a capped, funded wallet",
  },
  {
    title: "Publish in one line",
    body: "Front any endpoint and earn USDC on every call. One publish, live for every agent.",
    href: "/docs/become-a-capability",
    image: "/npm.svg",
    alt: "Publish your capability to npm",
    real: true,
  },
];

/**
 * Feature row (light theme, matches the home's white section). Each card: a
 * full-bleed illustration on the upper half, copy on the lower half. On hover
 * the card lifts and the art gently zooms — ease-out, GPU transforms only.
 */
export function FeatureCards() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((c) => (
        <a
          key={c.title}
          href={c.href}
          className="group flex flex-col overflow-hidden rounded-[18px] border border-[#E9E9E9] bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.03)]"
        >
          {/* Illustration — upper half. Real art/logos render clean; placeholders
              show contained + faded so the layout reads without looking broken. */}
          <div className="relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-[#F5F6F8] to-[#EBEDF0]">
            <img
              src={c.image}
              alt={c.alt}
              className={`absolute inset-0 h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-[1.04] ${
                c.real ? "p-12" : "p-10 opacity-40"
              }`}
            />
          </div>

          {/* Copy — lower half. */}
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-[16px] font-semibold tracking-[-0.01em] text-ink">{c.title}</h3>
            <p className="mt-2 flex-1 text-[13.5px] leading-[1.55] text-ink-muted">{c.body}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink transition-colors duration-150 group-hover:text-accent">
              Learn more
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
                className="transition-transform duration-200 ease-out group-hover:translate-x-1"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
