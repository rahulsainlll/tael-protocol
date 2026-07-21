const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://tael-protocol.onrender.com";
const REPO = "rahulsainlll/tael-protocol";

// The public page is a live directory, so refresh the catalog often and the
// (slower-moving) wishlist less often.
export const revalidate = 60;

interface Capability {
  slug: string;
  name: string;
  description: string;
  kind: string;
  price: string;
  verified: boolean;
}

interface Request {
  name: string;
  route: string | null;
  url: string;
}

/** Live capabilities from the public catalog, only the verified ones. */
async function getCapabilities(): Promise<Capability[]> {
  try {
    const res = await fetch(`${API_URL}/capabilities?limit=100`, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { capabilities?: Capability[] } | Capability[];
    const list = Array.isArray(data) ? data : (data.capabilities ?? []);
    return list.filter((c) => c.verified).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

/** Open `good-first-capability` issues, as the community wishlist. */
async function getRequests(): Promise<Request[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/issues?labels=good-first-capability&state=open&per_page=30`,
      { headers: { accept: "application/vnd.github+json" }, next: { revalidate: 600 } },
    );
    if (!res.ok) return [];
    const issues = (await res.json()) as { title: string; html_url: string }[];
    return issues.map((i) => {
      const title = i.title.replace(/^good-first-capability:\s*/i, "").trim();
      const routeMatch = title.match(/\(([A-Z]+\s+\/[^)]+)\)/);
      const name = title.replace(/\s*\([^)]*\)\s*$/, "").trim();
      return { name, route: routeMatch ? routeMatch[1]! : null, url: i.html_url };
    });
  } catch {
    return [];
  }
}

function priceLabel(price: string): string {
  return Number(price) > 0 ? `from $${Number(price)}` : "Free";
}

export default async function CapabilitiesPage() {
  const [capabilities, requests] = await Promise.all([getCapabilities(), getRequests()]);

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-28 pt-20">
      <p className="text-[13px] font-medium uppercase tracking-[0.16em] text-white/40">
        Capabilities
      </p>
      <h1 className="mt-3 text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[52px]">
        Everything an agent can pay for.
      </h1>
      <p className="mt-4 max-w-[54ch] text-[18px] leading-[1.6] text-white/55">
        The live directory of capabilities on Tael. Any AI agent can discover these and call them
        per request, settled in USDC — no keys, no accounts, no human in the loop.
      </p>

      {/* Available — the live, verified catalog. */}
      <section className="mt-16">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-medium uppercase tracking-[0.12em] text-white/50">
            Available
          </h2>
          <span className="text-[13px] tabular-nums text-white/35">{capabilities.length} live</span>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-[14px]">
            <thead>
              <tr className="border-b border-white/10 text-[12px] uppercase tracking-[0.08em] text-white/40">
                <th className="px-5 py-3 font-medium">Capability</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Description</th>
                <th className="px-5 py-3 font-medium">Type</th>
                <th className="px-5 py-3 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {capabilities.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-[14px] text-white/40">
                    The catalog is warming up. Refresh in a moment.
                  </td>
                </tr>
              ) : (
                capabilities.map((c) => (
                  <tr
                    key={c.slug}
                    className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4">
                      <a
                        href={`https://app.taelprotocol.xyz/marketplace/${c.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 font-medium text-white"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] font-mono text-[11px] text-accent">
                          {"{}"}
                        </span>
                        <span className="transition-colors group-hover:text-white/80">
                          {c.name}
                        </span>
                        {c.verified ? <VerifiedTick /> : null}
                      </a>
                    </td>
                    <td className="hidden max-w-[42ch] px-5 py-4 text-white/50 md:table-cell">
                      <span className="line-clamp-1">{c.description}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-white/10 px-2 py-0.5 text-[12px] font-medium uppercase tracking-wide text-white/60">
                        {c.kind}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums">
                      {Number(c.price) > 0 ? (
                        <span className="font-medium text-white">{priceLabel(c.price)}</span>
                      ) : (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-400">
                          Free
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Wanted — the community wishlist, from open GitHub issues. */}
      <section className="mt-20">
        <h2 className="text-[15px] font-medium uppercase tracking-[0.12em] text-white/50">
          Wanted
        </h2>
        <p className="mt-3 max-w-[54ch] text-[16px] leading-[1.6] text-white/50">
          Capabilities we&apos;d love built. Each is a small, self-contained contribution — one
          file, no secrets. Grab one and open a PR.
        </p>

        {requests.length > 0 ? (
          <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-white/10 text-[12px] uppercase tracking-[0.08em] text-white/40">
                  <th className="px-5 py-3 font-medium">Capability</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Endpoint</th>
                  <th className="px-5 py-3 text-right font-medium">Build</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr
                    key={r.url}
                    className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.025]"
                  >
                    <td className="px-5 py-4 font-medium text-white/90">{r.name}</td>
                    <td className="hidden px-5 py-4 sm:table-cell">
                      {r.route ? (
                        <code className="font-mono text-[13px] text-white/45">{r.route}</code>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[14px] font-medium text-accent transition-transform hover:translate-x-0.5"
                      >
                        Build
                        <Arrow />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={`https://github.com/${REPO}/issues/new?labels=good-first-capability&title=good-first-capability%3A%20`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
          >
            Request a capability
          </a>
          <a
            href="/docs/become-a-capability"
            className="rounded-full border border-white/15 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.06]"
          >
            Publish your own
          </a>
        </div>
      </section>
    </main>
  );
}

function VerifiedTick() {
  return (
    <span
      title="Verified by Tael"
      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function Arrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
