import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import { ChatHeader } from "../components/chat/ChatHeader";
import { Composer } from "../components/chat/Composer";

const SUGGESTIONS = [
  "What is Tael?",
  "How do payments settle?",
  "What's a Card, and what are its caps?",
];

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen flex-col">
      <ChatHeader address={session.address} />
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <p className="text-lg font-medium">What can I help with?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Streaming answers land in the next PR — for now, here's a preview of what to ask.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <Composer />
    </div>
  );
}