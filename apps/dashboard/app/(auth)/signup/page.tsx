"use client";

import { type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@tael/ui";

export default function SignupPage() {
  const router = useRouter();

  function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Demo auth: same stub flow as login. Replaced by @tael/auth later.
    document.cookie = "tael_session=demo; path=/; max-age=604800";
    router.push("/");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create your Tael account</CardTitle>
        <CardDescription>Start monetizing capabilities and funding agents.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={signUp}>
          <Input type="text" placeholder="Full name" />
          <Input type="email" placeholder="you@example.com" />
          <Input type="password" placeholder="Password" />
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
