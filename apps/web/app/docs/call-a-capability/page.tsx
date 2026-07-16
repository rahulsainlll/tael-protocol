import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "Setup", href: "#setup" },
  { label: "Call a capability", href: "#call" },
  { label: "Discover capabilities", href: "#discover" },
  { label: "Receipts", href: "#receipts" },
  { label: "Errors", href: "#errors" },
];

export default function CallACapabilityPage() {
  return (
    <DocPage
      eyebrow="Guides"
      title="Call a capability"
      lead="Reach any capability on Tael from your own code with a single API key. Payment happens automatically from the Card your key is linked to, so you never sign a transaction yourself."
      toc={TOC}
    >
      <H2 id="setup">Setup</H2>
      <P>
        Create a key in the dashboard under <strong>API Keys</strong> and link it to a funded{" "}
        <strong>Card</strong>. That Card&apos;s caps, both per call and per day, bound everything
        the key is allowed to spend.
      </P>
      <CodeBlock title="terminal" code={`pnpm add @tael/sdk`} />
      <CodeBlock
        title="setup.ts"
        code={`import { Tael } from "@tael/sdk";

const tael = new Tael({ apiKey: process.env.TAEL_KEY! });`}
      />

      <H2 id="call">Call a capability</H2>
      <P>
        Reference a capability by its slug. Both <Code>get</Code> and <Code>post</Code> return the
        response data directly, so there is nothing else to unwrap.
      </P>
      <CodeBlock
        title="call.ts"
        code={`const facts = await tael.get("cat-facts");
const reply = await tael.post("claude", { prompt: "Summarize this." });

// works for any capability, any method, with one key.`}
      />
      <Callout>
        You do not sign anything. Tael pays from the Card your key is linked to, stays within its
        caps, and hands you back the result.
      </Callout>

      <H2 id="discover">Discover capabilities</H2>
      <P>List or search the marketplace to find slugs and prices at runtime.</P>
      <CodeBlock
        title="discover.ts"
        code={`const all = await tael.list();               // every capability
const found = await tael.search("weather");  // by name or description

// each: { slug, name, description, kind, method, price, logoUrl, verified }`}
      />

      <H2 id="receipts">Receipts</H2>
      <P>
        Reach for <Code>call()</Code> when you want the full response: the data, the HTTP status,
        and the on-chain settlement receipt.
      </P>
      <CodeBlock
        title="receipt.ts"
        code={`const res = await tael.call("cat-facts");
res.data;            // the capability's response
res.status;          // HTTP status
res.receipt?.txHash; // proof the USDC payment settled on Stellar`}
      />

      <H2 id="errors">Errors</H2>
      <P>
        When a call fails, the client throws a <Code>TaelError</Code> that carries the
        gateway&apos;s message and its status code.
      </P>
      <Ul>
        <li>
          <Code>401</Code> means the key is unknown or has been revoked.
        </li>
        <li>
          <Code>402</Code> means the linked Card holds no USDC, or no Card is linked at all.
        </li>
        <li>
          <Code>403</Code> means the call exceeds the Card&apos;s per-call or daily cap.
        </li>
      </Ul>
      <CodeBlock
        title="errors.ts"
        code={`import { Tael, TaelError } from "@tael/sdk";

try {
  await tael.post("claude", { prompt: "hi" });
} catch (err) {
  if (err instanceof TaelError) {
    console.error(err.status, err.message); // e.g. 403 "Over this Card's per-call cap."
  }
}`}
      />
      <P>
        Would you rather publish your own capability? See{" "}
        <A href="/docs/become-a-capability">List your product as a capability</A>.
      </P>
    </DocPage>
  );
}
