import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@tael/ui";
import { Sidebar } from "../../components/chat/Sidebar";
import { ChatHeader } from "../../components/chat/ChatHeader";
import { getSession } from "../../lib/auth";
import { getCurrentUser } from "../../features/auth/current-user";
import { listThreads } from "../../features/threads/queries";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const [store, session] = await Promise.all([cookies(), getSession()]);
  // Belt-and-suspenders: middleware already redirects unauthenticated requests
  // to /login, but a server component should never assume a null-check away.
  if (!session) redirect("/login");

  const user = await getCurrentUser();
  const threads = user ? await listThreads(user.id) : [];
  // Read the last rail state on the server so it renders at the right width with no flash.
  const defaultOpen = store.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Sidebar
        initialThreads={threads.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() }))}
      />
      <SidebarInset>
        <ChatHeader address={session.address} />
        <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
