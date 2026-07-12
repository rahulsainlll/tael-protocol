import { WaitlistForm } from "../../_components/waitlist-form";

/**
 * In-article call to action — a dark card with the Tael mark, a short pitch, and
 * the real waitlist form (posts to /api/waitlist). Mirrors the animations.dev
 * "join the waitlist" block, on Tael's brand.
 */
export function WaitlistCTA() {
  return (
    <div className="my-14 rounded-[28px] border border-white/10 bg-white/[0.02] p-8 sm:p-10">
      <div className="flex items-center gap-2">
        <span className="font-display text-[26px] leading-none text-accent">t</span>
        <span className="text-[24px] font-medium tracking-[0.01em] text-white">tael</span>
      </div>

      <h3 className="mt-6 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-white sm:text-[28px]">
        The payment layer for autonomous AI agents.
      </h3>
      <p className="mt-3 max-w-[46ch] text-[16px] leading-[1.6] text-white/55">
        We&apos;re building the rails that let agents pay for any API, tool, or dataset, per call,
        in USDC on Stellar. Join the waitlist for early access and updates.
      </p>

      <WaitlistForm className="mt-7 max-w-[440px]" />
    </div>
  );
}
