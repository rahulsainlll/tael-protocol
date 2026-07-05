export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-24">
      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium uppercase tracking-widest text-brand-fg/60">Tael</span>
        <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">
          The payment layer for autonomous AI agents.
        </h1>
        <p className="max-w-2xl text-lg text-brand-fg/70">
          Let AI agents pay for APIs, MCP tools, data, and digital services using USDC on Stellar.
          Wrap any API with one SDK call and get paid every time it&apos;s used.
        </p>
      </div>

      <pre className="overflow-x-auto rounded-lg border border-brand-fg/10 bg-black/30 p-4 text-sm text-brand-fg/90">
        <code>{`import { tael } from "@tael/sdk";

export default tael({
  price: "0.02",
  handler: myApi,
});`}</code>
      </pre>

      <div className="flex gap-4 text-sm text-brand-fg/60">
        <span>USDC on Stellar</span>
        <span aria-hidden>·</span>
        <span>x402 payments</span>
        <span aria-hidden>·</span>
        <span>Non-custodial</span>
      </div>
    </main>
  );
}
