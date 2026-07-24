import {
  CapabilitiesExplorer,
  type Capability,
  type CapabilityRequest,
} from "./_components/capabilities-explorer";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://tael-protocol.onrender.com";
const REPO = "tael-protocol/tael";

// The page is a live directory, so refresh the catalog often.
export const revalidate = 60;

/** Live capabilities from the public catalog — verified only. */
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
async function getRequests(): Promise<CapabilityRequest[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/issues?labels=good-first-capability&state=open&per_page=50`,
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
      <p className="mt-4 max-w-[56ch] text-[18px] leading-[1.6] text-white/55">
        The live directory of what runs on Tael. Every capability here is an API, tool, or data
        source an autonomous agent can find and call on its own — paying per request in USDC, with
        no keys, accounts, or human in the loop. Switch to{" "}
        <span className="text-white/80">Requests</span> to see what we&apos;d love the community to
        build next.
      </p>

      <CapabilitiesExplorer capabilities={capabilities} requests={requests} />
    </main>
  );
}
