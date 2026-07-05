"use client";

import { useRouter } from "next/navigation";
import { Button } from "@tael/ui";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void logout()}>
      Sign out
    </Button>
  );
}
