import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { ConnectWalletButton } from "../../../features/auth/connect-wallet-button";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sign in to Tael</CardTitle>
        <CardDescription>
          Connect your Stellar wallet to continue — your wallet is your identity, no password
          needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ConnectWalletButton />
        <p className="text-center text-sm text-muted-foreground">
          New to Tael?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Get started
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
