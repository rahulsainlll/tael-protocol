import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { ConnectWalletButton } from "../../../features/auth/connect-wallet-button";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Connect to Tael</CardTitle>
        <CardDescription>
          Chat your way through the marketplace — search capabilities, link a Card, and pay per call
          in USDC. Your Stellar wallet is your identity, same as the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ConnectWalletButton />
      </CardContent>
    </Card>
  );
}
