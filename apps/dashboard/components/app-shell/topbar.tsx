import { getSession } from "../../lib/auth";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";

export async function Topbar() {
  const session = await getSession();

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b px-6">
      <ThemeToggle />
      {session ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.email}
          </span>
          <LogoutButton />
        </div>
      ) : null}
    </header>
  );
}
