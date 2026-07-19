"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import {
  cn,
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@tael/ui";
import { TaelLogo } from "../logo";

export interface ThreadSummary {
  id: string;
  title: string | null;
  updatedAt: string;
}

function isActive(pathname: string, threadId: string): boolean {
  return pathname === `/c/${threadId}`;
}

export function Sidebar({ initialThreads }: { initialThreads: ThreadSummary[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [threads, setThreads] = useState(initialThreads);

  const close = () => setOpenMobile(false);

  function newChat() {
    close();
    router.push("/");
  }

  async function removeThread(id: string) {
    setThreads((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/threads/${id}`, { method: "DELETE" });
    if (pathname === `/c/${id}`) router.push("/");
  }

  return (
    <SidebarPrimitive collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b">
        <Link
          href="/"
          onClick={close}
          aria-label="Tael Chat home"
          className="flex items-center gap-2 pl-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0"
        >
          <TaelLogo className="group-data-[collapsible=icon]:hidden" />
          <span
            className="hidden text-[22px] leading-none text-[#156DFC] group-data-[collapsible=icon]:inline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            t
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={newChat} tooltip="New chat">
                  <MessageSquarePlus />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {threads.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden">
                  No chats yet.
                </p>
              ) : null}
              {threads.map((thread) => (
                <SidebarMenuItem key={thread.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, thread.id)}
                    tooltip={thread.title ?? "New chat"}
                  >
                    <Link href={`/c/${thread.id}`} onClick={close}>
                      <span className={cn("truncate")}>{thread.title ?? "New chat"}</span>
                    </Link>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={() => void removeThread(thread.id)}
                    title="Delete chat"
                    className="hover:text-destructive"
                  >
                    <Trash2 />
                    <span className="sr-only">Delete</span>
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </SidebarPrimitive>
  );
}
