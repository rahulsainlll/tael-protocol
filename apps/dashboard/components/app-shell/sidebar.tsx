"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { navGroups } from "../../features/navigation/nav.config";
import { TaelLogo } from "../logo";

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Small BETA pill next to the wordmark. */
function BetaBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-[#156DFC] to-indigo-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm",
        className,
      )}
    >
      Beta
    </span>
  );
}

function truncateAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

/** Deterministic gradient so each wallet has a stable, recognisable chip. */
function walletGradient(address: string | null): string {
  if (!address) return "linear-gradient(135deg, #156DFC, #6366f1)";
  let hash = 0;
  for (let i = 0; i < address.length; i += 1) hash = (hash * 31 + address.charCodeAt(i)) >>> 0;
  const a = hash % 360;
  const b = (a + 42) % 360;
  return `linear-gradient(135deg, hsl(${a} 68% 55%), hsl(${b} 68% 45%))`;
}

export function AppSidebar({ address }: { address: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const close = () => setOpenMobile(false);

  async function signOut() {
    close();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center border-b">
        <Link
          href="/"
          onClick={close}
          aria-label="Tael home"
          className="flex items-center gap-2 pl-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:pl-0"
        >
          <TaelLogo className="group-data-[collapsible=icon]:hidden" />
          <span
            className="hidden text-[22px] leading-none text-[#156DFC] group-data-[collapsible=icon]:inline"
            style={{ fontFamily: "var(--font-display)" }}
          >
            t
          </span>
          <BetaBadge className="group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(pathname, item.href)}
                        tooltip={item.label}
                      >
                        <Link href={item.href} onClick={close}>
                          <Icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip={address ?? "Wallet"}>
              <Link href="/wallet" onClick={close}>
                <span
                  className="size-8 shrink-0 rounded-lg"
                  style={{ background: walletGradient(address) }}
                />
                <span className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-mono text-sm font-medium">
                    {address ? truncateAddress(address) : "Not connected"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Testnet</span>
                </span>
              </Link>
            </SidebarMenuButton>
            <SidebarMenuAction
              onClick={() => void signOut()}
              title="Sign out"
              className="top-1/2 -translate-y-1/2 hover:text-destructive"
            >
              <LogOut />
              <span className="sr-only">Sign out</span>
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
