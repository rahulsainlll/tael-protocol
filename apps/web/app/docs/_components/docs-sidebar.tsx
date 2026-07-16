"use client";

import { usePathname } from "next/navigation";

export const SECTIONS = [
  {
    title: "Get started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Authentication", href: "/docs/authentication" },
    ],
  },
  {
    title: "Guides",
    items: [
      { label: "Accept payments", href: "/docs/accept-payments" },
      { label: "Wrap an API", href: "/docs/wrap-an-api" },
      { label: "Call a capability", href: "/docs/call-a-capability" },
    ],
  },
  {
    title: "Partners",
    items: [{ label: "Become a capability", href: "/docs/become-a-capability" }],
  },
  {
    title: "SDKs",
    items: [
      { label: "Node.js", href: "/docs/sdk/node" },
      { label: "cURL", href: "/docs/sdk/curl" },
    ],
  },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-line px-4 py-6 dark:border-white/10 lg:block">
      {/* Search (visual only for now) */}
      <button
        type="button"
        className="mb-7 flex w-full items-center gap-2 rounded-lg border border-line px-3 py-2 text-[13px] text-ink-muted transition-colors hover:bg-surface/60 dark:border-white/10 dark:text-white/50 dark:hover:bg-white/[0.06]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Search...
        <kbd className="ml-auto rounded border border-line px-1.5 py-0.5 text-[11px] font-medium dark:border-white/10">
          ⌘K
        </kbd>
      </button>

      {SECTIONS.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="mb-2 px-3 text-[13px] font-semibold text-ink dark:text-white">
            {section.title}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={`block rounded-md px-3 py-1.5 text-[14px] tracking-[-0.01em] transition-colors ${
                      active
                        ? "bg-surface font-medium text-black dark:bg-white/[0.08] dark:text-white"
                        : "text-ink-muted hover:bg-surface/60 hover:text-black dark:text-white/50 dark:hover:bg-white/[0.06] dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </aside>
  );
}
