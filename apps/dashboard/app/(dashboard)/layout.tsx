import type { ReactNode } from "react";
import { Sidebar } from "../../components/app-shell/sidebar";
import { Topbar } from "../../components/app-shell/topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 space-y-8 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
