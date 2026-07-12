import { A, Code, Em, H2, Lead, Note, P, Pullquote, Strong, Ul } from "../_components/prose";
import { Faq } from "../_components/faq";
import { WaitlistCTA } from "../_components/waitlist-cta";

export function AgentsCantPay() {
  return (
    <>
      <Lead>
        An AI agent can research a market, write the code, and ship it. But the moment it needs
        something behind a paywall — a data feed, an OCR endpoint, a better model — it stops cold
        and waits for a human to paste in a credit card.
      </Lead>

      <P>
        We spend all our attention on making agents <Em>smarter</Em>. Bigger context windows, better
        tools, sharper reasoning. But the thing that most often ends an agent&apos;s run isn&apos;t
        intelligence. It&apos;s money. An agent that can&apos;t pay for what it needs isn&apos;t
        autonomous — it&apos;s an intern that has to come find you every time there&apos;s a bill.
      </P>

      <H2 id="human">Everything on the internet assumes a human is buying</H2>
      <P>
        Every paid API you&apos;ve ever used was designed for a person. You create an account. You
        verify an email. You paste a card into a Stripe form. You get an API key, a dashboard, and a
        monthly invoice. That flow is completely reasonable — for a human who signs up once and uses
        the service for months.
      </P>
      <P>
        An agent has none of that. It doesn&apos;t have an account. It can&apos;t be handed your
        card without becoming a liability. And it discovers what it needs <Em>at runtime</Em> — the
        whole point is that you didn&apos;t know in advance it would need a currency API at 2am. The
        billing model of the web and the way agents actually work are fundamentally mismatched.
      </P>

      <H2 id="fixes">The obvious fixes all break</H2>
      <P>Every team hits this wall and tries the same three things first. They all fall apart:</P>
      <Ul>
        <li>
          <Strong>Give the agent your API key.</Strong> Works until the agent — or a prompt
          injection riding in on some webpage — burns your quota, hits a rate limit at the worst
          moment, or leaks the key into a log.
        </li>
        <li>
          <Strong>Give it your credit card.</Strong> Now there are no per-call limits, no real
          visibility into what it bought, and unbounded downside if it loops.
        </li>
        <li>
          <Strong>Pre-buy credits with every vendor.</Strong> Fine for two or three services.
          Hopeless across the long tail of tools an agent might reach for — and it defeats the point
          of an agent that finds what it needs on its own.
        </li>
      </Ul>
      <P>
        Each of these is a workaround for the same missing primitive: a way for software to pay for
        one thing, once, without a standing relationship.
      </P>

      <Pullquote>Agents don&apos;t need accounts. They need to pay per request.</Pullquote>

      <H2 id="requirements">What machine-native payments actually require</H2>
      <P>
        If you design payments for agents from scratch — not for humans — you arrive at a short,
        strict list:
      </P>
      <Ul>
        <li>
          <Strong>Instant settlement.</Strong> The call happens now; the money has to move now. No
          three-day holds, no chargebacks weeks later.
        </li>
        <li>
          <Strong>Real micropayments.</Strong> A single call might cost a fifth of a cent. Card
          rails — with their fixed ~30¢ minimum — make that economically impossible.
        </li>
        <li>
          <Strong>No accounts.</Strong> Identity is a wallet the agent controls, not an email and a
          password it can&apos;t manage.
        </li>
        <li>
          <Strong>Programmable limits.</Strong> Spend caps the agent literally cannot exceed, set by
          you, enforced before the money moves.
        </li>
      </Ul>
      <P>
        That list quietly rules out cards and bank transfers, and points at something specific: a{" "}
        <Strong>stablecoin on a fast, cheap chain</Strong> — USDC on Stellar — settling in seconds
        for a fraction of a cent, plus an open protocol for paying as you go over plain HTTP.
      </P>

      <H2 id="x402">402: the status code the web forgot</H2>
      <P>
        HTTP has always had a status code reserved for exactly this moment:{" "}
        <Strong>402 Payment Required</Strong>. It&apos;s been sitting in the spec, unused, for 25
        years — because there was never a clean way to actually pay in the flow of a request. The{" "}
        <A href="/docs/accept-payments">x402</A> protocol finally wires it up. The exchange is four
        steps and one round trip:
      </P>
      <Ul>
        <li>The agent calls an endpoint with no payment.</li>
        <li>
          The server replies <Code>402</Code> with a price and a pay-to address.
        </li>
        <li>
          The agent signs a USDC payment and retries, carrying the proof in an{" "}
          <Code>X-PAYMENT</Code> header.
        </li>
        <li>The server verifies it, does the work, and returns the result with a receipt.</li>
      </Ul>
      <Note>
        No signup. No API key. No invoice at the end of the month. And it&apos;s non-custodial — the
        payment settles straight from the agent&apos;s wallet to the provider&apos;s, in the same
        transaction. Nobody holds the money in between.
      </Note>

      <H2 id="unlocks">What this unlocks</H2>
      <P>
        A payment primitive this small changes what an agent is capable of — and what a developer
        can sell:
      </P>
      <Ul>
        <li>
          <Strong>Agents buy exactly what they need,</Strong> the moment they need it, inside limits
          you set — no human in the loop, no standing subscriptions.
        </li>
        <li>
          <Strong>Any developer can monetize an API</Strong> by wrapping it once and getting paid
          per call. No accounts to manage, no billing system to build, no Stripe integration.
        </li>
        <li>
          <Strong>A real marketplace of capabilities</Strong> becomes possible — APIs, tools,
          models, and datasets that agents can discover and pay for on their own.
        </li>
      </Ul>

      <P>
        This is the layer we&apos;re building at <Strong>Tael</Strong>: wrap any capability, give it
        a price, and let agents pay per call in USDC on Stellar. The agent brings its own wallet;
        the builder gets paid automatically. That&apos;s the whole idea — give agents the one thing
        they were missing, and get out of the way.
      </P>

      <WaitlistCTA />

      <Faq
        groups={[
          {
            title: "The basics",
            items: [
              {
                q: "What is a payment layer for AI agents?",
                a: "It's infrastructure that lets software pay for a single request — an API call, a tool use, a dataset query — without an account, an API key, or a subscription. The agent pays per call from its own wallet, and the provider gets the money instantly.",
              },
              {
                q: "Why USDC on Stellar, and not cards or another chain?",
                a: "Agent payments need instant settlement, sub-cent micropayments, and no accounts. Card rails can't do a fifth-of-a-cent charge economically, and bank transfers are slow. USDC settles in seconds on Stellar for a fraction of a cent — which is exactly the shape of one API call.",
              },
              {
                q: "Is there a token to buy?",
                a: "No. Payments are made in USDC — a regulated dollar stablecoin. There is no Tael token, ICO, or coin to speculate on.",
              },
            ],
          },
          {
            title: "For developers",
            items: [
              {
                q: "How do I monetize my API with this?",
                a: "You wrap your existing endpoint once and give it a price. From then on, every call is gated by an x402 payment — no accounts, no keys, no billing system to build. You get paid per call, automatically.",
              },
              {
                q: "Do I have to build billing, invoices, or Stripe?",
                a: "None of it. The payment happens inside the request itself, so there are no invoices to send, no subscriptions to manage, and no payment provider to integrate.",
              },
              {
                q: "Is it custodial? Does anyone hold my funds?",
                a: "No. The agent's payment settles directly to your wallet in the same transaction that authorizes the call. Nobody sits in the middle holding your money.",
              },
            ],
          },
          {
            title: "For agents & buyers",
            items: [
              {
                q: "How does an agent actually pay?",
                a: "It calls the endpoint, gets a 402 with the price, signs a USDC payment from its wallet, and retries with the proof attached. The server verifies the payment and returns the result. One round trip, no signup.",
              },
              {
                q: "Can I put a limit on what an agent spends?",
                a: "Yes — spending policies are enforced before any money moves, so an agent can't exceed the caps you set. That's the difference between handing an agent a card and giving it a budget it can't blow past.",
              },
            ],
          },
        ]}
      />
    </>
  );
}
