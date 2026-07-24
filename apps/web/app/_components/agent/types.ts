export interface AgentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** When the message was created (ms epoch), for the "· time" meta line. */
  createdAt?: number;
}

/** Props for the reusable widget, all optional so `<TaelAgent />` just works. */
export interface TaelAgentProps {
  /** POST endpoint that streams the reply as plain text. */
  endpoint?: string;
  /** Name shown in the header. */
  name?: string;
  /** Subtitle under the name. */
  tagline?: string;
  /** First assistant message shown when the panel opens. */
  intro?: string;
  /** One-tap starter prompts. */
  suggestions?: string[];
}
