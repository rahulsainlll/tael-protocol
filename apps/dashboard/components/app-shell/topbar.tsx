import { getSession } from "../../lib/auth";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

function truncateAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address;
}

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <ThemeToggle />
      {session ? (
        <div className="flex items-center gap-3">
          <span
            title={session.address}
            className="hidden font-mono text-sm text-muted-foreground sm:inline"
          >
            {truncateAddress(session.address)}
          </span>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
