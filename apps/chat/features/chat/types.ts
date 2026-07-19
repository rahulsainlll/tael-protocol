/** A single turn in the conversation, as sent to/from the client. */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** Body the client posts to `/api/chat`. */
export interface ChatRequestBody {
  messages: ChatMessage[];
  threadId?: string;
}
