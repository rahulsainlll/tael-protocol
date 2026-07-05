import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@tael/ui";
import { ConnectWalletButton } from "../../../features/auth/connect-wallet-button";
import { DevLogin } from "../../../features/auth/dev-login";

const isTestnet = process.env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet";

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
      <CardContent className="space-y-4">
        <ConnectWalletButton />
        {isTestnet ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or, on testnet</span>
              </div>
            </div>
            <DevLogin />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
