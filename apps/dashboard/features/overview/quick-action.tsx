import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideProps } from "lucide-react";

export interface QuickActionProps {
  href: string;
  icon: ComponentType<LucideProps>;
  title: string;
  subtitle: string;
}

/**
 * A launchpad tile: one primary thing the user can go do. Presentational only —
 * the parent decides the copy (which shifts with the user's state).
 */
export function QuickAction({ href, icon: Icon, title, subtitle }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl border bg-card p-5 transition-all duration-150 ease-out hover:border-foreground/20 hover:shadow-sm active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors duration-150 ease-out group-hover:bg-foreground group-hover:text-background">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ArrowUpRight className="absolute right-4 top-4 h-4 w-4 text-muted-foreground opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100" />
    </Link>
  );
}
