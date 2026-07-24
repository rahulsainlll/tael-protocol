/* eslint-disable @next/next/no-img-element */

/** Capabilities to spotlight on the home. Offering-first titles ("Loans by
 *  trustline"); the full list lives at /capabilities. Logos live in /public
 *  (nebula.png is in; add trustline.png + stellar.png). */
const FEATURED = [
  { title: "Stellar lookups", by: "tael", type: "API", price: "Free", logo: "/stellar.png" },
  { title: "Loans", by: "trustline", type: "Credit", price: "from $0.1", logo: "/trustline.webp" },
  { title: "MCP payments", by: "nebula", type: "MCP", price: "Paid", logo: "/nebula.png" },
];

/** OpenRouter-style "Featured" section, adapted for capabilities (light theme).
 *  Restraint per the design rules: no card lift; only the "View all" link and
 *  the logo react on hover, with ease-out transforms. */
export function FeaturedCapabilities() {
  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-[20px] font-semibold tracking-[-0.01em] text-ink">
            Featured capabilities
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className="text-ink-muted"
            >
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </h2>
          <p className="mt-1 text-[14px] text-ink-muted">Live and ready for agents to call.</p>
        </div>
        <a
          href="/capabilities"
          className="group inline-flex items-center gap-1 text-[14px] font-medium text-ink-muted transition-colors hover:text-ink"
        >
          View all
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="transition-transform duration-150 ease-out group-hover:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {FEATURED.map((c) => (
          <a
            key={c.title}
            href="/capabilities"
            className="group rounded-[14px] border border-[#E9E9E9] bg-white p-5 shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] transition-colors duration-150 hover:border-[#DCDCDE]"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#EDEDEF] bg-white">
                <img
                  src={c.logo}
                  alt=""
                  className="h-full w-full object-contain transition-transform duration-200 ease-out group-hover:scale-105"
                />
              </span>
              <div className="min-w-0">
                <span className="block truncate text-[16px] font-semibold text-ink">{c.title}</span>
                <span className="text-[13px] text-ink-muted">by {c.by}</span>
              </div>
            </div>

            <div className="my-4 h-px w-full bg-[#EEEEF0]" />

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[12px] text-ink-muted">Type</p>
                <p className="mt-0.5 text-[14px] font-medium text-ink">{c.type}</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-ink-muted">Price</p>
                <p className="mt-0.5 text-[14px] font-medium tabular-nums text-ink">{c.price}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
