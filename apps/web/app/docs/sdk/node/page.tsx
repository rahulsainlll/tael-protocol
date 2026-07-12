import { A, Code, CodeBlock, DocPage, H2, P, Ul } from "../../_components/doc-page";

const TOC = [
  { label: "Install", href: "#install" },
  { label: "createTael", href: "#create-tael" },
  { label: "tael", href: "#tael" },
  { label: "TaelOptions", href: "#options" },
  { label: "Verifiers", href: "#verifiers" },
  { label: "Exports", href: "#exports" },
];

export default function NodeSdkPage() {
  return (
    <DocPage
      eyebrow="SDKs"
      title="Node.js"
      lead="Reference for @tael/sdk — wrap any Fetch handler with x402 payments."
      toc={TOC}
    >
      <H2 id="install">Install</H2>
      <CodeBlock title="terminal" code={`pnpm add @tael/sdk`} />

      <H2 id="create-tael">createTael(defaults)</H2>
      <P>
        Binds service-wide settlement details once and returns a <Code>paid()</Code> function for
        defining individual routes. This is the recommended entry point.
      </P>
      <CodeBlock
        title="createTael"
        code={`const paid = createTael({
  payTo,     // StellarAddress that receives settlement
  issuer,    // StellarAddress of the USDC issuer
  network,   // "stellar-testnet" | "stellar-mainnet"
  verifier,  // PaymentVerifier
});

// paid(route) -> (Request) => Promise<Response>
export const POST = paid({ price: "0.02", handler });`}
      />

      <H2 id="tael">tael(options)</H2>
      <P>
        The one-shot form. Takes the full option set and returns a payment-gated Fetch handler{" "}
        <Code>(Request) =&gt; Promise&lt;Response&gt;</Code>. Use it when a route doesn&apos;t share
        defaults with others.
      </P>
      <CodeBlock
        title="tael"
        code={`const handler = tael({
  price: "0.02",
  payTo,
  issuer,
  network: "stellar-testnet",
  verifier: createMockVerifier(),
  handler: ({ request, receipt }) => Response.json({ ok: true }),
});`}
      />

      <H2 id="options">TaelOptions</H2>
      <Ul>
        <li>
          <Code>price: string</Code> — price per call, a decimal USDC string (e.g.{" "}
          <Code>&quot;0.02&quot;</Code>).
        </li>
        <li>
          <Code>payTo: string</Code> — Stellar address that receives settlement.
        </li>
        <li>
          <Code>issuer: string</Code> — the USDC issuer on the target network.
        </li>
        <li>
          <Code>network: &quot;stellar-testnet&quot; | &quot;stellar-mainnet&quot;</Code>
        </li>
        <li>
          <Code>verifier: PaymentVerifier</Code> — verifies + settles the payment.
        </li>
        <li>
          <Code>description?: string</Code> — human text shown in the <Code>402</Code> challenge.
        </li>
        <li>
          <Code>handler: (ctx) =&gt; Response | Promise&lt;Response&gt;</Code> — runs after payment.
          Receives <Code>&#123; request, receipt &#125;</Code>.
        </li>
      </Ul>
      <P>
        With <Code>createTael</Code>, <Code>payTo</Code>/<Code>issuer</Code>/<Code>network</Code>/
        <Code>verifier</Code> come from the defaults and each route supplies only <Code>price</Code>
        , <Code>handler</Code>, and an optional <Code>description</Code>.
      </P>

      <H2 id="verifiers">Verifiers</H2>
      <P>
        The <Code>PaymentVerifier</Code> is the chain-specific port. It&apos;s injected so the SDK
        stays chain-agnostic and your handlers stay portable.
      </P>
      <Ul>
        <li>
          <Code>createMockVerifier()</Code> — re-exported from the SDK; accepts any well-formed
          proof for dev and tests.
        </li>
        <li>
          The Stellar verifier from <Code>@tael/stellar</Code> — real on-chain settlement for
          production.
        </li>
      </Ul>

      <H2 id="exports">Exports</H2>
      <Ul>
        <li>
          <Code>createTael</Code>, <Code>tael</Code>
        </li>
        <li>
          Types: <Code>TaelOptions</Code>, <Code>TaelDefaults</Code>, <Code>TaelRoute</Code>,{" "}
          <Code>TaelContext</Code>, <Code>TaelHandler</Code>, <Code>FetchHandler</Code>
        </li>
        <li>
          Re-exported from <Code>@tael/payments</Code>: <Code>createMockVerifier</Code>,{" "}
          <Code>PaymentVerifier</Code>, <Code>PaymentNetwork</Code>, <Code>SettlementReceipt</Code>
        </li>
      </Ul>
      <P>
        Prefer raw HTTP? See the <A href="/docs/sdk/curl">cURL guide</A>.
      </P>
    </DocPage>
  );
}
