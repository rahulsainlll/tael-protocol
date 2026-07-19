import { A, Callout, Code, CodeBlock, DocPage, H2, P, Ul } from "../_components/doc-page";

const TOC = [
  { label: "The model", href: "#model" },
  { label: "What you can list", href: "#kinds" },
  { label: "What you need", href: "#requirements" },
  { label: "Pricing & fees", href: "#pricing" },
  { label: "Publish it", href: "#publish" },
  { label: "Verification", href: "#verification" },
  { label: "Onboarding prompt", href: "#prompt" },
];

/** The prompt a partner pastes into their own LLM to map their product onto
 *  Tael's capability model and produce a manifest to hand back to us. */
const PARTNER_PROMPT = `You are helping me put my product on Tael, the payment layer for AI agents.
I want to list my product as one or more capabilities on Tael, so that anyone can use it
with a single Tael API key and pay me per call in USDC on Stellar. Your job is to map my
product onto Tael's capability model and produce a concrete capability manifest that I can
hand to the Tael team.

## How Tael works
- A capability is any service reached through a paid URL of the form https://<tael-gateway>/c/<slug>.
- A buyer calls that URL with a Tael API key. Tael verifies the USDC payment on Stellar, then
  proxies the call to my real endpoint and returns my response. I get paid per call automatically,
  and I never touch the buyer's wallet.
- The requirement is simple: I expose a normal HTTP endpoint (GET or POST) that Tael calls on each
  request. Tael injects my upstream credentials on the server, so buyers never see my key.
- A capability can be any of these kinds: api, mcp, agent, model, or dataset.
- I set a price per call in USDC. Tael takes a marketplace fee of about 1% in the same transaction,
  and I keep the rest, settled to a Stellar address I choose.

## What I want from you
1. If I have not told you already, ask me what my product does and how it is accessed (its endpoints,
   tools, and authentication).
2. Find the largest surface I can reasonably offer. List every endpoint, tool, dataset, or model I
   could expose as a capability, because each one is another way for people to pay me.
3. For each capability, produce one row of a manifest with these fields:
   - name, kind (api, mcp, agent, model, or dataset), and a one-line description
   - the endpoint URL and its HTTP method
   - how Tael should authenticate to my upstream (Bearer, x-api-key, a custom header, or none)
   - the request shape (its parameters or body) and a sample response
   - a suggested price per call in USDC, with a short reason
4. Flag anything that does not fit a plain paid HTTP endpoint, such as streaming, stateful sessions,
   MCP over HTTP, or on-chain signing, and suggest how to adapt it.
5. Ask me for my Stellar payout address, and remind me it must hold a USDC trustline for Tael's
   issuer (shown on the publish form) or payments will be rejected on-chain.

## Output
Return the completed manifest as a table, followed by a short note on anything that needs a custom
adapter. Optimize for the most value: list everything worth exposing, not just a single endpoint.`;

export default function BecomeACapabilityPage() {
  return (
    <DocPage
      eyebrow="Partners"
      title="List your product as a capability"
      lead="Bring your API, MCP server, agent, model, or dataset to Tael. Anyone can reach it with a single key and pay for it by the call in USDC, and your earnings settle to you automatically."
      toc={TOC}
    >
      <H2 id="model">The model</H2>
      <P>
        A <strong>capability</strong> is any service reached through a single paid URL. You keep
        running your product exactly as it is today, and Tael sits in front of it as a metered
        gateway that handles payment on every request.
      </P>
      <Ul>
        <li>A buyer calls your capability with one Tael API key.</li>
        <li>
          Tael verifies the USDC payment on Stellar, then <strong>proxies the call</strong> to your
          real endpoint and returns your response unchanged.
        </li>
        <li>
          You are paid per call, in USDC, automatically. You never see the buyer&apos;s wallet, and
          the buyer never sees your upstream key.
        </li>
      </Ul>
      <P>On the buyer&apos;s side, the entire integration is a single line of code:</P>
      <CodeBlock
        title="the buyer's code"
        code={`import { Tael } from "@tael/sdk";
const tael = new Tael({ apiKey: process.env.TAEL_KEY });

// your product, called and paid for with one key:
const result = await tael.post("your-product", { ...input });`}
      />
      <Callout>
        The only real requirement is a normal, callable HTTP endpoint. If your users can already
        reach it with a request today, Tael can put a price on it.
      </Callout>

      <H2 id="kinds">What you can list</H2>
      <P>A capability can take any of the following forms. Choose whatever fits your product.</P>
      <Ul>
        <li>
          <strong>API.</strong> Any REST or HTTP endpoint, such as a weather service or an OCR
          engine.
        </li>
        <li>
          <strong>MCP.</strong> A Model Context Protocol server or a single tool from one.
        </li>
        <li>
          <strong>Agent.</strong> A hosted agent that accepts a task and returns a result.
        </li>
        <li>
          <strong>Model.</strong> An inference endpoint, for example a language or image model.
        </li>
        <li>
          <strong>Dataset.</strong> A paid data feed or query endpoint.
        </li>
      </Ul>

      <H2 id="requirements">What you need</H2>
      <Ul>
        <li>
          <strong>A paid HTTP endpoint</strong> that Tael can call on each request, using{" "}
          <Code>GET</Code> or <Code>POST</Code>.
        </li>
        <li>
          <strong>Upstream authentication, if any.</strong> If your endpoint needs a key, you hand
          it to Tael once, and Tael injects it on the server for every call. Buyers never see it.
        </li>
        <li>
          <strong>A price per call</strong> in USDC, where fractions of a cent are perfectly fine.
        </li>
        <li>
          <strong>A Stellar payout address</strong> where your earnings land. It must hold a{" "}
          <strong>USDC trustline for Tael&apos;s issuer</strong> (see below), or payments are
          rejected on-chain.
        </li>
      </Ul>
      <Callout>
        <strong>Set up the USDC trustline first.</strong> Tael settles in USDC from a specific
        issuer, and Stellar will reject a payment to an account that doesn&apos;t trust that asset (
        <Code>op_no_trust</Code>). Before you publish, add a USDC trustline to your payout wallet
        for Tael&apos;s issuer &mdash; the exact issuer address is shown on the publish form, next
        to the pay-to field. This is a one-time transaction on your side.
      </Callout>
      <Callout>
        Streaming, stateful sessions, and on-chain signing do not fit the plain request and response
        model out of the box, but they are supported through a custom adapter. Note them in your
        manifest and we will map them with you.
      </Callout>

      <H2 id="pricing">Pricing &amp; fees</H2>
      <P>
        <strong>You set the price per call.</strong> Whatever you choose becomes the amount a buyer
        pays in the <Code>402</Code> challenge for your capability.
      </P>
      <P>
        Tael charges a <strong>marketplace fee of 1%</strong> on each call, taken in the very same
        USDC transaction. Because settlement is non-custodial, your share lands directly at your
        payout address. On a <Code>$0.010</Code> call, for instance, you keep <Code>$0.0099</Code>{" "}
        and Tael takes <Code>$0.0001</Code>. There are no monthly fees and no minimums.
      </P>

      <H2 id="publish">Publish it</H2>
      <P>
        Sign in to the dashboard with your Stellar wallet, open <strong>My Capabilities</strong>,
        and add one. The wizard walks you through it in four short steps:
      </P>
      <Ul>
        <li>
          <strong>Describe.</strong> Name your capability, choose its kind, and add its endpoint,
          your price per call, and your Stellar payout address. If your endpoint needs a key, set
          the auth scheme (Bearer, or a header such as <Code>x-api-key</Code>) and paste the key. It
          is encrypted and injected on the server, so buyers never see it.
        </li>
        <li>
          <strong>Test.</strong> Run each request live against your real endpoint. Tael captures the
          actual response and uses it as the public sample, so what buyers see is what your API
          truly returns.
        </li>
        <li>
          <strong>Answer.</strong> Reply to a short set of AI-generated questions about your
          capability. Your answers become its public FAQ.
        </li>
        <li>
          <strong>Publish.</strong> Your capability goes live in the marketplace immediately and is
          callable by any Tael key. It starts marked <strong>Pending review</strong> until Tael
          verifies it (see below).
        </li>
      </Ul>
      <P>
        The <A href="/docs/quickstart">Quickstart</A> walks through the whole flow end to end.
      </P>

      <H2 id="verification">Verification</H2>
      <P>
        Every capability carries a status that tells buyers how much Tael has vetted it. Publishing
        never blocks on this, and it never limits what your capability can do. It is purely a signal
        of trust.
      </P>
      <Ul>
        <li>
          <strong>Pending review.</strong> The state every new third-party capability starts in. It
          is fully live: listed in the marketplace, discoverable, and callable, and you earn on
          every call from the moment you publish. It simply has not yet been reviewed by the Tael
          team, so it shows a neutral <strong>Pending</strong> badge rather than the green check.
        </li>
        <li>
          <strong>Verified.</strong> A trust badge that only the Tael team grants, after we review
          the capability. Verified capabilities carry the green check that buyers look for, and they
          rank ahead of unverified ones in discovery.
        </li>
      </Ul>
      <P>
        To move from Pending to Verified, make sure your listing is accurate and complete: a clear
        description that matches what the endpoint returns, a working live test, an answered FAQ,
        and a payout wallet that holds the required USDC trustline (see{" "}
        <A href="#requirements">What you need</A>). Then reach out to the team through your
        capability contact or our community channels, and we will review it. There is nothing extra
        to build.
      </P>
      <Callout>
        Verification is a badge, not a gate. A Pending capability is a fully working, fully paid
        capability. Verified simply tells buyers that Tael has looked it over and vouches for it.
      </Callout>
      <P>
        <strong>First-party and partner capabilities.</strong> Some capabilities are verified by
        Tael from day one. These include our own first-party model capabilities, where Tael wraps
        providers such as <strong>Claude</strong> and <strong>Grok</strong> so any agent can call a
        frontier model with a single key and pay for it by the token in USDC, and our vetted
        ecosystem partners such as <strong>Nebula</strong> for on-Stellar agentic actions and{" "}
        <strong>TrustLine</strong> for agent credit lines. These arrive Verified because we run or
        directly vet them, which is the same bar we hold every other capability to before granting
        the badge.
      </P>

      <H2 id="prompt">Onboarding prompt</H2>
      <P>
        The quickest way to map your product onto Tael is to paste the prompt below into your own
        LLM, whether that is Claude, ChatGPT, or anything else. It interviews you, uncovers every
        part of your product worth exposing, and produces a <strong>capability manifest</strong> you
        can hand straight back to us, so we can list you with the widest surface and the least back
        and forth.
      </P>
      <CodeBlock title="paste into your LLM" lang="bash" code={PARTNER_PROMPT} />
      <P>
        Send the finished manifest to the team and we will get your capabilities live. The more you
        expose, the more ways people have to pay you.
      </P>
    </DocPage>
  );
}
