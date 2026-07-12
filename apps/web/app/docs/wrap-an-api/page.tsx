import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "One handler", href: "#one-handler" },
  { label: "Shared defaults", href: "#defaults" },
  { label: "Multiple routes", href: "#multiple" },
  { label: "Reading the receipt", href: "#receipt" },
  { label: "Frameworks", href: "#frameworks" },
];

export default function WrapAnApiPage() {
  return (
    <DocPage
      eyebrow="Guides"
      title="Wrap an API"
      lead="Put a per-call price on any existing HTTP endpoint with one SDK call."
      toc={TOC}
    >
      <H2 id="one-handler">One handler</H2>
      <P>
        The lowest-level primitive is <Code>tael()</Code>. Give it a price, your settlement details,
        and a handler; it returns a payment-gated Fetch handler.
      </P>
      <CodeBlock
        title="tael()"
        code={`import { tael, createMockVerifier } from "@tael/sdk";

export const handler = tael({
  price: "0.02",
  payTo: "G...",
  issuer: "G...",
  network: "stellar-testnet",
  verifier: createMockVerifier(),
  handler: () => Response.json({ ok: true }),
});`}
      />

      <H2 id="defaults">Shared defaults</H2>
      <P>
        Most services expose several priced routes that share the same <Code>payTo</Code>,{" "}
        <Code>issuer</Code>, <Code>network</Code>, and <Code>verifier</Code>. Bind those once with{" "}
        <Code>createTael()</Code> so each route only declares what&apos;s different — its price and
        handler.
      </P>
      <CodeBlock
        title="createTael()"
        code={`import { createTael, createMockVerifier } from "@tael/sdk";

export const paid = createTael({
  payTo: process.env.TAEL_PAY_TO!,
  issuer: process.env.USDC_ISSUER!,
  network: "stellar-testnet",
  verifier: createMockVerifier(),
});`}
      />

      <H2 id="multiple">Multiple routes</H2>
      <P>Reuse the wrapper across endpoints, each with its own price:</P>
      <CodeBlock
        title="routes"
        code={`export const ocr = paid({
  price: "0.02",
  description: "Extract text from a document",
  handler: runOcr,
});

export const translate = paid({
  price: "0.05",
  description: "Translate a document",
  handler: runTranslate,
});`}
      />
      <Callout>
        Prices are decimal strings of USDC (e.g. <Code>&quot;0.02&quot;</Code>). The value becomes{" "}
        <Code>maxAmountRequired</Code> in the <Code>402</Code> challenge for that route.
      </Callout>

      <H2 id="receipt">Reading the receipt</H2>
      <P>
        Your handler runs only after payment settles and receives a <Code>receipt</Code> alongside
        the request, so you can attribute usage or log settlement:
      </P>
      <CodeBlock
        title="handler context"
        code={`handler: async ({ request, receipt }) => {
  const input = await request.json();
  const result = await doWork(input);
  return Response.json({ result, paidBy: receipt.payer });
}`}
      />

      <H2 id="frameworks">Frameworks</H2>
      <P>
        Because the wrapper is a plain <Code>(Request) =&gt; Promise&lt;Response&gt;</Code>, it
        works anywhere the Web Fetch standard does:
      </P>
      <Ul>
        <li>
          <strong>Next.js</strong> — <Code>export const POST = paid(&#123;...&#125;)</Code> in a
          route handler.
        </li>
        <li>
          <strong>Hono</strong> — mount it as a handler on a route.
        </li>
        <li>
          <strong>Bun, Deno, Cloudflare Workers</strong> — use it as the fetch entrypoint.
        </li>
      </Ul>
      <P>
        For the exact option shapes, see the <A href="/docs/sdk/node">Node.js SDK reference</A>.
      </P>
    </DocPage>
  );
}
