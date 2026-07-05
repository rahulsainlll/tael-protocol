"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@tael/ui";

export default function LoginPage() {
  const router = useRouter();

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo auth: set the stub session cookie, then enter the app.
    // Replaced by @tael/auth (Better Auth + passkeys) later.
    document.cookie = "tael_session=demo; path=/; max-age=604800";
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to Tael</CardTitle>
        <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={signIn}>
          <Input type="email" placeholder="you@example.com" defaultValue="demo@tael.dev" />
          <Input type="password" placeholder="Password" defaultValue="demo" />
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
