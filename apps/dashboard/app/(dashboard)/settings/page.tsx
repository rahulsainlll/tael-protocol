import { ArrowUpRight, BookOpen, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { PageHeader } from "../../../components/page-header";
import { getCurrentUser } from "../../../features/capabilities/current-user";
import { AccountCard } from "../../../features/settings/account-card";
import { AppearanceCard } from "../../../features/settings/appearance-card";

export const dynamic = "force-dynamic";

const LINKS = [
  { label: "Documentation", href: "https://taelprotocol.xyz/docs", icon: BookOpen },
  { label: "Discord community", href: "https://discord.gg/UtW9dZKwBW", icon: MessageCircle },
  { label: "@taelprotocol on X", href: "https://x.com/taelprotocol", icon: ArrowUpRight },
];

function ResourcesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Resources</CardTitle>
        <CardDescription>Docs, community, and updates.</CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-medium">{link.label}</span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform duration-150 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account, appearance, and preferences."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <AccountCard address={user?.walletAddress ?? ""} displayName={user?.displayName ?? null} />
        <div className="space-y-4">
          <AppearanceCard />
          <ResourcesCard />
        </div>
      </div>
    </>
  );
}
