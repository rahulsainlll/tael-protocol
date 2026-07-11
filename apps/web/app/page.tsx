/* eslint-disable @next/next/no-img-element */
import { SiteHeader } from "./_components/site-header";
import { WaitlistForm } from "./_components/waitlist-form";
import { ProviderCards } from "./_components/provider-cards";
import { FooterLinks } from "./_components/footer-links";

// Pixel-anchored: dark upper region matches the original design, then a long,
// smooth grey→white fade (410→740px, ~330px) so it blends gently into white
// before the footer section begins.
const HERO_GRADIENT =
  "linear-gradient(180deg, #0A0A0A 0px, #000000 130px, #27272A 260px, #505158 410px, #FFFFFF 740px)";

// Orbiting provider icons, positioned on the arc (coords relative to the 1440px stage).
const ORBIT = [
  {
    src: "/logos/orbit-anthropic.svg",
    w: 35,
    h: 24,
    size: 60,
    left: 242,
    top: 382,
    alt: "Anthropic",
  },
  { src: "/logos/orbit-openai.svg", w: 33, h: 32, size: 62, left: 365, top: 240, alt: "OpenAI" },
  { src: "/logos/orbit-claude.svg", w: 36, h: 36, size: 64, left: 686, top: 124, alt: "Claude" },
  { src: "/logos/orbit-grok.svg", w: 36, h: 36, size: 64, left: 863, top: 156, alt: "Grok" },
  {
    src: "/logos/orbit-perplexity.png",
    w: 50,
    h: 50,
    size: 62,
    left: 1017,
    top: 240,
    alt: "Perplexity",
  },
  { src: "/logos/orbit-lovable.svg", w: 27, h: 28, size: 60, left: 1138, top: 382, alt: "Lovable" },
];

const iconCircle =
  "absolute flex items-center justify-center rounded-full border border-white/10 bg-white/20 backdrop-blur-[2.65px]";

export default function HomePage() {
  return (
    <>
      {/* Sticky nav (lifted to the page root so it stays pinned page-wide) */}
      <SiteHeader />

      {/* Hero — dark gradient with orbiting provider icons. Pulled up under the
          sticky nav so the gradient still spans the full 740px design height. */}
      <section className="relative -mt-12 overflow-hidden" style={{ background: HERO_GRADIENT }}>
        <div className="relative left-1/2 h-[760px] w-[1440px] -translate-x-1/2">
          {/* concentric orbit rings */}
          <div
            className="pointer-events-none absolute rounded-full border border-white/[0.05]"
            style={{ left: 193, top: 154, width: 1054, height: 1054 }}
          />
          <div
            className="pointer-events-none absolute rounded-full border border-white/[0.03]"
            style={{ left: 284, top: 286, width: 872, height: 872 }}
          />

          {/* vertical guide rails (start below the nav) */}
          <div
            className="pointer-events-none absolute h-full w-px bg-white/[0.09]"
            style={{ left: 80, top: 48 }}
          />
          <div
            className="pointer-events-none absolute h-full w-px bg-white/[0.09]"
            style={{ left: 1360, top: 48 }}
          />

          {/* orbit icons */}
          {ORBIT.map((o) => (
            <div
              key={o.alt}
              className={iconCircle}
              style={{ left: o.left, top: o.top, width: o.size, height: o.size }}
            >
              <img src={o.src} alt={o.alt} style={{ width: o.w, height: o.h }} />
            </div>
          ))}
          {/* pause icon (two bars) */}
          <div className={iconCircle} style={{ left: 518, top: 156, width: 64, height: 64 }}>
            <div className="flex items-center gap-1.5">
              <span className="w-[6.5px] rounded-[3px] bg-white" style={{ height: 26 }} />
              <span className="w-[6.5px] rounded-[3px] bg-white" style={{ height: 26 }} />
            </div>
          </div>

          {/* Headline + subtext */}
          <div className="absolute left-1/2 top-[283px] flex w-[485px] max-w-[calc(100vw-48px)] -translate-x-1/2 flex-col items-center gap-4 text-center">
            <h1 className="text-[40px] font-normal leading-[1.15] tracking-[-0.026em] text-white sm:text-[46px] sm:leading-[53px]">
              The payment layer.
              <br />
              For AI agents.
            </h1>
            <p className="text-[18px] font-normal leading-[26px] tracking-[-0.035em] text-white">
              Connect every app you use - 100 apps and 3000 actions, all in one platform.
            </p>
          </div>

          {/* Waitlist */}
          <div className="absolute left-1/2 top-[481px] w-[464px] max-w-[calc(100vw-48px)] -translate-x-1/2">
            <WaitlistForm className="w-full" />
          </div>
        </div>
      </section>

      {/* Providers + footer */}
      <section className="bg-white pb-24 pt-6">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-16 px-6 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <FooterLinks />
          <ProviderCards />
        </div>
      </section>
    </>
  );
}
