import type { ReactNode } from "react";

export interface FaqItem {
  q: string;
  a: ReactNode;
}

export interface FaqGroup {
  title: string;
  items: FaqItem[];
}

/** Grouped FAQ accordion — categories with collapsible questions (native
 *  <details>, closed by default), dark editorial styling. */
export function Faq({ groups }: { groups: FaqGroup[] }) {
  return (
    <section className="mt-20">
      {groups.map((group) => (
        <div key={group.title} className="mt-12 first:mt-0">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-white/40">
            {group.title}
          </p>
          <div className="mt-4 border-t border-white/10">
            {group.items.map((item, i) => (
              <details key={i} className="group border-b border-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-medium text-white/90 transition-colors hover:text-white">
                  {item.q}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="shrink-0 text-white/40 transition-transform group-open:rotate-180"
                    aria-hidden
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <div className="pb-5 pr-8 text-[16px] leading-[1.65] text-white/55">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
