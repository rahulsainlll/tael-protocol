import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "Install", href: "#install" },
  { label: "Wrap a handler", href: "#wrap" },
  { label: "Run it", href: "#run" },
  { label: "What happens", href: "#flow" },
  { label: "Next steps", href: "#next" },
];

export default function QuickstartPage() {
  return (
    <DocPage
      eyebrow="Get started"
      title="Quickstart"
      lead="Gate any HTTP handler behind a USDC payment in a few minutes."
      toc={TOC}
    >
      <H2 id="install">Install</H2>
      <P>Add the SDK to your project. It ships as ESM + types and has no framework dependency.</P>
      <CodeBlock title="terminal" code={`pnpm add @tael/sdk\n# or: npm i @tael/sdk`} />

      <H2 id="wrap">Wrap a handler</H2>
      <P>
        <Code>createTael</Code> binds your service-wide settlement details once, then returns a{" "}
        <Code>paid()</Code> wrapper you put around any Fetch-style handler. Here it is as a Next.js
        route handler:
      </P>
      <CodeBlock
        title="app/api/ocr/route.ts"
        code={`import { createTael, createMockVerifier } from "@tael/sdk";

const paid = createTael({
  payTo: process.env.TAEL_PAY_TO!,   // your Stellar address (G...)
  issuer: process.env.USDC_ISSUER!,  // USDC issuer on your network
  network: "stellar-testnet",
  verifier: createMockVerifier(),    // swap for the Stellar verifier in prod
});

export const POST = paid({
  price: "0.02",                     // 0.02 USDC per call
  description: "Extract text from a document",
  handler: async ({ request, receipt }) => {
    const body = await request.json();
    // ...your real work; runs only after payment settles...
    return Response.json({ text: "INVOICE #1042 ...", paidBy: receipt.payer });
  },
});`}
      />
      <Callout>
        The wrapper returns a standard <Code>(Request) =&gt; Promise&lt;Response&gt;</Code>, so the
        same code drops into Hono, Bun, Deno, and Cloudflare Workers unchanged — not just Next.js.
      </Callout>

      <H2 id="run">Run it</H2>
      <P>
        Start your app and call the route with no payment. Tael answers with a{" "}
        <Code>402 Payment Required</Code> challenge instead of running your handler:
      </P>
      <CodeBlock
        title="terminal"
        code={`curl -i -X POST http://localhost:3000/api/ocr

HTTP/1.1 402 Payment Required
content-type: application/json

{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "stellar-testnet",
      "maxAmountRequired": "0.02",
      "payTo": "G...",
      "asset": { "code": "USDC", "issuer": "G..." },
      "resource": "/api/ocr"
    }
  ]
}`}
      />

      <H2 id="flow">What happens on each call</H2>
      <Ul>
        <li>
          No <Code>X-PAYMENT</Code> header → Tael replies <Code>402</Code> with the challenge above.
        </li>
        <li>
          The agent signs a Stellar USDC payment and retries with the <Code>X-PAYMENT</Code> proof.
        </li>
        <li>
          Tael verifies the payment through your <Code>verifier</Code>, runs your handler, and
          echoes an <Code>X-PAYMENT-RESPONSE</Code> receipt.
        </li>
      </Ul>

      <H2 id="next">Next steps</H2>
      <Ul>
        <li>
          <A href="/docs/authentication">Authentication</A> — why there are no API keys.
        </li>
        <li>
          <A href="/docs/accept-payments">Accept payments</A> — the full challenge → receipt flow.
        </li>
        <li>
          <A href="/docs/sdk/node">Node.js SDK</A> — the complete option reference.
        </li>
      </Ul>
    </DocPage>
  );
}
