import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "The flow", href: "#flow" },
  { label: "1. The challenge", href: "#challenge" },
  { label: "2. The payment", href: "#payment" },
  { label: "3. Verification", href: "#verification" },
  { label: "Verifiers", href: "#verifiers" },
];

export default function AcceptPaymentsPage() {
  return (
    <DocPage
      eyebrow="Guides"
      title="Accept payments"
      lead="The full x402 flow behind every paid call: challenge, pay, verify, receipt."
      toc={TOC}
    >
      <H2 id="flow">The flow</H2>
      <Ul>
        <li>A client requests a paid resource with no payment.</li>
        <li>
          The server responds <Code>402 Payment Required</Code> with one or more acceptable payment
          options.
        </li>
        <li>
          The client pays and retries with an <Code>X-PAYMENT</Code> proof.
        </li>
        <li>The server verifies + settles the payment, runs the handler, and returns a receipt.</li>
      </Ul>
      <Callout>
        The protocol envelope lives in <Code>@tael/payments</Code>; on-chain settlement is injected
        as a <Code>PaymentVerifier</Code> (implemented by <Code>@tael/stellar</Code>). The SDK wires
        them together for you.
      </Callout>

      <H2 id="challenge">1. The challenge</H2>
      <P>
        A <Code>402</Code> body carries an <Code>accepts</Code> array. Each entry is a
        fully-specified payment requirement — amount, asset, recipient, and the resource being
        bought:
      </P>
      <CodeBlock
        title="402 Payment Required"
        code={`{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "stellar-testnet",
      "maxAmountRequired": "0.02",
      "payTo": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
      "asset": { "code": "USDC", "issuer": "G..." },
      "resource": "/v1/ocr",
      "description": "Extract text from a document",
      "maxTimeoutSeconds": 60
    }
  ]
}`}
      />

      <H2 id="payment">2. The payment</H2>
      <P>
        The client builds a signed Stellar payment for <Code>maxAmountRequired</Code> USDC to{" "}
        <Code>payTo</Code>, wraps it in the payment envelope, and base64-encodes it into the{" "}
        <Code>X-PAYMENT</Code> header. The <Code>exact</Code> scheme means it must pay exactly the
        amount required — no more, no less.
      </P>
      <CodeBlock
        title="X-PAYMENT (decoded)"
        code={`{
  "x402Version": 1,
  "scheme": "exact",
  "network": "stellar-testnet",
  "payload": { "transaction": "<signed XDR>" }
}`}
      />

      <H2 id="verification">3. Verification &amp; receipt</H2>
      <P>
        Tael checks that the proof&apos;s scheme and network match the challenge, then delegates to
        the verifier to settle on-chain. On success it runs your handler and attaches an{" "}
        <Code>X-PAYMENT-RESPONSE</Code> receipt to the response. A malformed or underpaid proof gets
        another <Code>402</Code> with an <Code>error</Code> message rather than reaching your code.
      </P>

      <H2 id="verifiers">Verifiers</H2>
      <P>
        The verifier is the only chain-specific piece, and it&apos;s injected so your handler code
        stays portable:
      </P>
      <Ul>
        <li>
          <Code>createMockVerifier()</Code> — accepts any well-formed proof. Use it in dev and
          tests.
        </li>
        <li>
          The Stellar verifier from <Code>@tael/stellar</Code> — submits and confirms the
          transaction on the network. Use it in production.
        </li>
      </Ul>
      <P>
        Ready to add this to an endpoint? See <A href="/docs/wrap-an-api">Wrap an API</A>.
      </P>
    </DocPage>
  );
}
