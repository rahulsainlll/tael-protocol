import { A, Callout, Code, CodeBlock, DocPage, H2, P } from "../../_components/doc-page";

const TOC = [
  { label: "1. Get the challenge", href: "#challenge" },
  { label: "2. Build the proof", href: "#proof" },
  { label: "3. Send the payment", href: "#send" },
  { label: "4. Read the receipt", href: "#receipt" },
];

export default function CurlSdkPage() {
  return (
    <DocPage
      eyebrow="SDKs"
      title="cURL"
      lead="Drive the x402 flow with raw HTTP — no SDK required."
      toc={TOC}
    >
      <P>
        Tael is just HTTP. Any client that can set a header can pay for a call, which makes it easy
        to test endpoints from the terminal.
      </P>

      <H2 id="challenge">1. Get the challenge</H2>
      <P>
        Call the resource with no payment. You get a <Code>402</Code> whose <Code>accepts[0]</Code>{" "}
        tells you exactly what to pay and to whom.
      </P>
      <CodeBlock
        title="terminal"
        code={`curl -i -X POST https://api.example.com/v1/ocr

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
      "resource": "/v1/ocr"
    }
  ]
}`}
      />

      <H2 id="proof">2. Build the proof</H2>
      <P>
        Sign a Stellar payment of <Code>maxAmountRequired</Code> USDC to <Code>payTo</Code>, put its
        XDR into the payment envelope, and base64-encode the JSON:
      </P>
      <CodeBlock
        title="X-PAYMENT (before encoding)"
        code={`{
  "x402Version": 1,
  "scheme": "exact",
  "network": "stellar-testnet",
  "payload": { "transaction": "<signed XDR>" }
}`}
      />
      <CodeBlock title="terminal" code={`PAYMENT=$(printf '%s' "$ENVELOPE_JSON" | base64)`} />
      <Callout>
        The signed transaction is produced with a Stellar wallet or the Stellar SDK. Tael verifies
        and settles it — it never holds your keys.
      </Callout>

      <H2 id="send">3. Send the payment</H2>
      <P>
        Retry the request with the <Code>X-PAYMENT</Code> header. Tael verifies it, runs the
        handler, and returns your result.
      </P>
      <CodeBlock
        title="terminal"
        code={`curl -i -X POST https://api.example.com/v1/ocr \\
  -H "X-PAYMENT: $PAYMENT" \\
  -H "content-type: application/json" \\
  -d '{ "document_url": "https://example.com/invoice.pdf" }'

HTTP/1.1 200 OK
x-payment-response: <base64 receipt>

{ "text": "INVOICE #1042 ..." }`}
      />

      <H2 id="receipt">4. Read the receipt</H2>
      <P>
        The <Code>X-PAYMENT-RESPONSE</Code> header is a base64 receipt proving the payment settled —
        decode it to confirm the amount, payer, and transaction.
      </P>
      <P>
        Building a real integration in code instead? The <A href="/docs/sdk/node">Node.js SDK</A>{" "}
        handles the encoding and verification for you.
      </P>
    </DocPage>
  );
}
