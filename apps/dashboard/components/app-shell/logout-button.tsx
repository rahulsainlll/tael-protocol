"use client";

import { useRouter } from "next/navigation";
import { Button } from "@tael/ui";

export function LogoutButton() {
  const router = useRouter();

  function logout() {
    // Clears the demo session cookie. Replaced by @tael/auth sign-out later.
    document.cookie = "tael_session=; path=/; max-age=0";
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={logout}>
      Sign out
    </Button>
  );
}
