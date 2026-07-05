import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { ConnectWalletButton } from "../../../features/auth/connect-wallet-button";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Connect to Tael</CardTitle>
        <CardDescription>
          Your Stellar wallet is your identity — no email, no password. Connecting creates your
          account if you&apos;re new.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectWalletButton />
      </CardContent>
    </Card>
  );
}
