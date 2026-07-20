import type { ReactNode } from "react";
import { AgentsCantPay } from "./agents-cant-pay";
import { PaymentsInfrastructureForAgents } from "./payments-infrastructure-for-agents";

export interface Post {
  slug: string;
  title: string;
  /** One-line summary — used on the index, in metadata, and social previews. */
  description: string;
  /** ISO date. */
  date: string;
  readingTime: string;
  body: () => ReactNode;
}

export const posts: Post[] = [
  {
    slug: "payments-infrastructure-for-ai-agents",
    title: "Payments infrastructure for AI agents",
    description:
      "Tael lets any API, model, or service charge autonomous agents per call in USDC. No billing system, no accounts, no sales, no integration beyond one line of code.",
    date: "2026-07-20",
    readingTime: "3 min read",
    body: PaymentsInfrastructureForAgents,
  },
  {
    slug: "agents-can-think-they-cant-pay",
    title: "Agents can think. They can't pay.",
    description:
      "AI agents can reason, plan, and ship code, but the moment they need to buy something, a human has to step in. Here's why, and what a payment layer for agents actually looks like.",
    date: "2026-07-12",
    readingTime: "6 min read",
    body: AgentsCantPay,
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
