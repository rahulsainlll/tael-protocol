import type { Metadata } from "next";
import type { ReactNode } from "react";

const DESCRIPTION =
  "The live directory of Tael capabilities: APIs, tools, and data that any AI agent can discover and pay for per call in USDC — plus the capabilities we'd love the community to build.";

export const metadata: Metadata = {
  title: "Capabilities",
  description: DESCRIPTION,
  alternates: { canonical: "/capabilities" },
  openGraph: {
    type: "website",
    url: "https://taelprotocol.xyz/capabilities",
    siteName: "Tael",
    title: "Tael Capabilities",
    description: DESCRIPTION,
  },
};

export default function CapabilitiesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0e0e11] text-white">
      {/* Top nav — mirrors the blog layout, with Capabilities active. */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0e0e11]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <a href="/" className="flex items-center gap-1">
            <span className="font-display text-[20px] leading-none text-accent">t</span>
            <span className="text-[20px] font-medium tracking-[0.01em] text-white">tael</span>
          </a>
          <nav className="flex items-center gap-6 text-[14px] font-medium">
            <a href="/capabilities" className="text-white transition-colors">
              Capabilities
            </a>
            <a href="/blog" className="text-white/55 transition-colors hover:text-white">
              Blog
            </a>
            <a href="/docs" className="text-white/55 transition-colors hover:text-white">
              Docs
            </a>
            <a
              href="/"
              className="rounded-full bg-white px-4 py-1.5 text-[13px] font-semibold text-black transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-[0.97]"
            >
              Join waitlist
            </a>
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-2 px-6 py-10 text-center">
          <div className="flex items-center gap-1">
            <span className="font-display text-[18px] leading-none text-accent">t</span>
            <span className="text-[16px] font-medium tracking-[0.01em] text-white">tael</span>
          </div>
          <p className="text-[13px] text-white/40">The payment layer for autonomous AI agents.</p>
        </div>
      </footer>
    </div>
  );
}
