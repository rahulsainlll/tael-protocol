import {
  BarChart3,
  Bot,
  Boxes,
  Building2,
  KeyRound,
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  Star,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Single source of truth for the dashboard sidebar. Order = display order. */
export const navItems: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Wallet", href: "/wallet", icon: Wallet },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "My Capabilities", href: "/capabilities", icon: Boxes },
  { label: "My Agents", href: "/agents", icon: Bot },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Payments", href: "/payments", icon: ArrowLeftRight },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Organizations", href: "/organizations", icon: Building2 },
  { label: "API Keys", href: "/api-keys", icon: KeyRound },
  { label: "Settings", href: "/settings", icon: Settings },
];
