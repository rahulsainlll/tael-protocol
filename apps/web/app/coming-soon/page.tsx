import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coming soon — Tael",
  description: "This page isn't ready yet.",
};

export default function ComingSoonPage() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
      style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #000000 45%, #27272A 100%)" }}
    >
      <a href="/" className="flex items-center gap-1">
        <span className="font-display text-[24px] leading-none text-accent">t</span>
        <span className="text-[24px] font-medium tracking-[0.01em] text-white">tael</span>
      </a>

      <div className="flex flex-col items-center gap-3">
        <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/50">
          Coming soon
        </span>
        <h1 className="text-[40px] font-normal leading-[1.1] tracking-[-0.03em] text-white sm:text-[56px]">
          We&apos;re building this.
        </h1>
        <p className="mx-auto max-w-[420px] text-[16px] leading-6 tracking-[-0.01em] text-white/60">
          This page isn&apos;t ready yet. Join the waitlist and we&apos;ll let you know the moment
          it goes live.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/"
          className="rounded-full bg-white px-6 py-3 text-[14px] font-medium text-black transition-opacity hover:opacity-90"
        >
          Join the waitlist
        </a>
        <a
          href="/"
          className="rounded-full border border-white/20 px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-white/10"
        >
          Back to home
        </a>
      </div>
    </main>
  );
}
