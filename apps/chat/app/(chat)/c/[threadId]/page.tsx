import { notFound } from "next/navigation";
import { ChatView } from "../../../../components/chat/ChatView";
import { getCurrentUser } from "../../../../features/auth/current-user";
import { getThreadWithMessages } from "../../../../features/threads/queries";
import type { ChatMessage } from "../../../../features/chat/types";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const result = await getThreadWithMessages(threadId, user.id);
  if (!result) notFound();

  const initialMessages: ChatMessage[] = result.messages.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
  }));

  return <ChatView threadId={threadId} initialMessages={initialMessages} />;
}
