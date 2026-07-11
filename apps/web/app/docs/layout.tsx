import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DocsSidebar } from "./_components/docs-sidebar";
import { ThemeToggle } from "./_components/theme-toggle";

export const metadata: Metadata = {
  title: "Docs — Tael",
  description: "Documentation for Tael, the payment layer for autonomous AI agents.",
};

const TABS = [
  { label: "Documentation", href: "/docs", active: true },
  { label: "API Reference", href: "#" },
  { label: "Knowledge Base", href: "#" },
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink dark:bg-[#0a0a0a] dark:text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0a]/90">
        <div className="flex h-14 items-center gap-8 px-6">
          <a href="/" className="flex items-center gap-1">
            <span className="font-display text-[20px] leading-none text-accent">t</span>
            <span className="text-[20px] font-medium tracking-[0.01em] text-black dark:text-white">
              tael
            </span>
          </a>

          <nav className="hidden items-center gap-6 md:flex">
            {TABS.map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                className={`text-[14px] font-medium tracking-[-0.01em] transition-colors ${
                  tab.active
                    ? "text-black dark:text-white"
                    : "text-ink-muted hover:text-black dark:text-white/50 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <a
              href="/"
              className="rounded-full bg-black px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-black"
            >
              Join waitlist
            </a>
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="mx-auto flex w-full max-w-[1440px]">
        <DocsSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
