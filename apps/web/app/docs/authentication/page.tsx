import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "No keys, no accounts", href: "#no-keys" },
  { label: "The X-PAYMENT header", href: "#x-payment" },
  { label: "The receipt", href: "#receipt" },
  { label: "Networks", href: "#networks" },
];

export default function AuthenticationPage() {
  return (
    <DocPage
      eyebrow="Get started"
      title="Authentication"
      lead="In Tael, the payment is the authentication — there are no API keys."
      toc={TOC}
    >
      <H2 id="no-keys">No keys, no accounts</H2>
      <P>
        Traditional APIs authenticate a caller with a shared secret (an API key or OAuth token) and
        bill them later. That assumes a human signed up first. Tael removes that step: an agent
        proves it is allowed to call your endpoint by <strong>paying for the call</strong>, in the
        same request. There is nothing to register and no credential to leak.
      </P>
      <Callout>
        This is the <A href="/docs/accept-payments">x402 / HTTP-402</A> model: a resource answers{" "}
        <Code>402 Payment Required</Code> with its price, the caller attaches a payment proof, and
        the server verifies it before doing any work.
      </Callout>

      <H2 id="x-payment">The X-PAYMENT header</H2>
      <P>
        A paying client retries the request with an <Code>X-PAYMENT</Code> header: a base64-encoded
        JSON envelope containing a signed Stellar transaction (XDR) that transfers the required USDC
        to your <Code>payTo</Code> address.
      </P>
      <CodeBlock
        title="X-PAYMENT (decoded)"
        code={`{
  "x402Version": 1,
  "scheme": "exact",
  "network": "stellar-testnet",
  "payload": {
    "transaction": "<base64 signed Stellar XDR>"
  }
}`}
      />
      <P>
        Tael validates the protocol invariants (scheme and network must match the challenge) and
        then hands the signed transaction to your <Code>PaymentVerifier</Code>, which settles it on
        Stellar. Only if settlement succeeds does your handler run.
      </P>

      <H2 id="receipt">The receipt</H2>
      <P>
        On success the response carries an <Code>X-PAYMENT-RESPONSE</Code> header — a base64 receipt
        proving settlement. Your handler also receives the settlement details as{" "}
        <Code>receipt</Code> so you can attribute the call to the paying wallet.
      </P>
      <CodeBlock
        title="handler context"
        code={`handler: async ({ request, receipt }) => {
  // receipt describes the settled payment (payer, amount, tx)
  return Response.json({ ok: true, paidBy: receipt.payer });
}`}
      />

      <H2 id="networks">Networks</H2>
      <P>Tael settles in USDC on Stellar. Pick the network per environment:</P>
      <Ul>
        <li>
          <Code>stellar-testnet</Code> — for development, with the mock verifier or test USDC.
        </li>
        <li>
          <Code>stellar-mainnet</Code> — for production, with the real Stellar verifier.
        </li>
      </Ul>
      <P>
        See <A href="/docs/sdk/node">the Node.js SDK reference</A> for how to plug in the Stellar
        verifier.
      </P>
    </DocPage>
  );
}
