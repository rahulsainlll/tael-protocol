import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on machine-native payments — how AI agents pay for APIs, tools, and data with x402 and USDC on Stellar.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "https://taelprotocol.xyz/blog",
    siteName: "Tael",
    title: "Tael Blog",
    description:
      "Notes on machine-native payments — how AI agents pay for APIs, tools, and data with x402 and USDC on Stellar.",
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <a href="/" className="flex items-center gap-1">
            <span className="font-display text-[20px] leading-none text-accent">t</span>
            <span className="text-[20px] font-medium tracking-[0.01em] text-white">tael</span>
          </a>
          <nav className="flex items-center gap-6 text-[14px] font-medium">
            <a href="/blog" className="text-white transition-colors">
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
