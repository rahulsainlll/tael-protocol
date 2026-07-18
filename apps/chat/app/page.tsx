import { redirect } from "next/navigation";
import { getSession } from "../lib/auth";
import { ChatWindow } from "../components/chat/ChatWindow";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ChatWindow address={session.address} />;
}