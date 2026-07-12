import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Delicious_Handrawn } from "next/font/google";
import "@tael/ui/globals.css";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Used only for the hand-drawn "t" in the Tael wordmark — matches the
// marketing site's logo (apps/web).
const delicious = Delicious_Handrawn({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tael Dashboard",
  description: "Manage wallets, capabilities, agents, and revenue on Tael.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${delicious.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
