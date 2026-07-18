import { Bot } from "lucide-react";
import { AccountMenu } from "./AccountMenu";

export function ChatHeader({ address }: { address: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Tael Chat</span>
      </div>
      <AccountMenu address={address} />
    </header>
  );
}