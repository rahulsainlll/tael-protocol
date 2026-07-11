import { WaitlistTrigger } from "./waitlist-trigger";

const COLUMNS = [
  { title: "Product", links: ["Apps", "Guide", "FAQs", "Try now"] },
  { title: "Connect", links: ["Discord", "X"] },
];

// Real destinations for links that have one; others fall back to "#".
const HREFS: Record<string, string> = {
  Guide: "/coming-soon",
  FAQs: "/coming-soon",
  Discord: "https://discord.gg/tcb6b7ZYha",
  X: "https://x.com/taelprotocol?s=21",
};

const item =
  "rounded-[6px] px-2 py-0.5 text-[14px] font-medium leading-6 tracking-[-0.02em] transition-colors";

function SocialIcon({
  label,
  href = "#",
  children,
}: {
  label: string;
  href?: string;
  children: React.ReactNode;
}) {
  const external = href !== "#";
  return (
    <a
      href={href}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="text-[#8F8E8E] transition-colors hover:text-black"
    >
      {children}
    </a>
  );
}

export function FooterLinks() {
  return (
    <div className="flex flex-col gap-16 lg:gap-[198px]">
      {/* Link columns */}
      <div className="flex gap-16 md:gap-[84px]">
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col items-start gap-2">
            <span className={`${item} text-[#989898]`}>{col.title}</span>
            {col.links.map((label) =>
              label === "Try now" ? (
                <WaitlistTrigger
                  key={label}
                  className={`${item} text-left text-black hover:bg-[#ECECED]`}
                >
                  {label}
                </WaitlistTrigger>
              ) : (
                (() => {
                  const href = HREFS[label] ?? "#";
                  const external = href.startsWith("http");
                  return (
                    <a
                      key={label}
                      href={href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${item} text-black hover:bg-[#ECECED]`}
                    >
                      {label}
                    </a>
                  );
                })()
              ),
            )}
          </div>
        ))}
      </div>

      {/* Social icons */}
      <div className="flex gap-6">
        <SocialIcon label="X (Twitter)" href={HREFS.X}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path d="M15.2726 1.58691H18.0838L11.9421 8.60649L19.1673 18.1586H13.51L9.07901 12.3653L4.00894 18.1586H1.19601L7.76518 10.6503L0.833984 1.58691H6.63491L10.6401 6.88219L15.2726 1.58691ZM14.2859 16.4759H15.8436L5.78848 3.18119H4.11687L14.2859 16.4759Z" />
          </svg>
        </SocialIcon>
      </div>
    </div>
  );
}
