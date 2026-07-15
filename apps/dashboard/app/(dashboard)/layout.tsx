import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { SIDEBAR_COOKIE_NAME, SidebarInset, SidebarProvider } from "@tael/ui";
import { AppSidebar } from "../../components/app-shell/sidebar";
import { Topbar } from "../../components/app-shell/topbar";
import { getSession } from "../../lib/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const [store, session] = await Promise.all([cookies(), getSession()]);
  // Read the last rail state on the server so it renders at the right width with no flash.
  const defaultOpen = store.get(SIDEBAR_COOKIE_NAME)?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar address={session?.address ?? null} />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 space-y-8 p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
