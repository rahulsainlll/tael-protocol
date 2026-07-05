import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { ConnectWalletButton } from "../../../features/auth/connect-wallet-button";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Get started with Tael</CardTitle>
        <CardDescription>
          Connect a Stellar wallet to create your account. No email, no password — the wallet is
          your identity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectWalletButton />
        <p className="text-center text-sm text-muted-foreground">
          Already have a wallet connected?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
