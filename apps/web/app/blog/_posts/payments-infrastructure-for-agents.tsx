import { CodeBlock, Code, Em, H2, Lead, P, Pullquote, Strong, Ul } from "../_components/prose";
import { WaitlistCTA } from "../_components/waitlist-cta";

export function PaymentsInfrastructureForAgents() {
  return (
    <>
      <Lead>
        Tael lets any API, model, or service charge autonomous agents per call, in USDC, settled on
        Stellar. No billing system to build. No accounts to manage. No integration beyond a single
        line of code. You bring your endpoint; Tael becomes the revenue layer in front of it.
      </Lead>

      <P>
        You built something worth paying for. An API, a model, a data feed, an agent. The product
        was never the hard part. Everything <Em>around</Em> getting paid for it was: the billing
        system, the customer accounts, the API keys, the rate limits, the invoices, the sales calls,
        the integrations. Months of work that has nothing to do with what you actually made.
      </P>

      <H2 id="what-tael-runs">What Tael runs for you</H2>
      <Ul>
        <li>
          <Strong>Billing.</Strong> We handle it. No Stripe, no invoices, no subscriptions, no
          metering, no chasing payments. Every call settles in USDC on Stellar, automatically and
          non-custodially, straight to your wallet in the same transaction.
        </li>
        <li>
          <Strong>Accounts and auth.</Strong> We handle it. You never issue an API key, set a rate
          limit, or manage a customer. Tael&apos;s gateway is the front door for every buyer. You
          get called, you get paid.
        </li>
        <li>
          <Strong>Distribution.</Strong> It happens here. Your service lives in a marketplace that
          agents search, discover, and call on their own. No demos, no onboarding, no selling one
          customer at a time.
        </li>
        <li>
          <Strong>Migration.</Strong> None. Your endpoint stays exactly where it is. Tael sits in
          front of it as a metered gateway. There is nothing to rebuild.
        </li>
      </Ul>

      <H2 id="what-changes">The part that changes everything</H2>
      <P>
        Once your service is on Tael, any autonomous AI agent can pay for it and use it, per call,
        with a single key, no human in the loop. You are no longer selling to people who evaluate,
        negotiate, and expense. You are selling to software that finds a capability, pays for it,
        and keeps working.
      </P>
      <Pullquote>
        A market that does not sleep, does not forget to renew, and grows every time another agent
        comes online.
      </Pullquote>

      <H2 id="what-it-costs">What it costs you to join</H2>
      <P>One line.</P>
      <CodeBlock>{`import { Tael } from "@tael/sdk";
const tael = new Tael({ apiKey: process.env.TAEL_KEY });

await tael.publish({
  name: "My API",
  kind: "api",
  endpoint: "https://api.example.com/v1",
  payTo: "G...",
  operations: [{ name: "Predict", path: "/predict", price: "0.01" }],
});`}</CodeBlock>
      <P>
        That is the whole integration. Your capability goes live, agents can call it, and USDC lands
        in your wallet on every request. Install it with <Code>pnpm add @tael/sdk</Code>.
      </P>

      <WaitlistCTA />
    </>
  );
}
