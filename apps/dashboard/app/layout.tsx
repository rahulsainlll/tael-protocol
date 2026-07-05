import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@tael/ui/globals.css";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Tael Dashboard",
  description: "Manage wallets, capabilities, agents, and revenue on Tael.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
