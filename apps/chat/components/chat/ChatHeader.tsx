import { TaelLogo, BetaBadge } from "../logo";
import { ThemeToggle } from "../app-shell/theme-toggle";
import { AccountMenu } from "./AccountMenu";

export function ChatHeader({ address }: { address: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        <TaelLogo />
        <BetaBadge />
      </div>
      <div className="flex items-center gap-2">
        <AccountMenu address={address} />
        <ThemeToggle />
      </div>
    </header>
  );
}
