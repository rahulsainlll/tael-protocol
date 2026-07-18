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

const delicious = Delicious_Handrawn({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tael Chat",
  description: "Discover, call, and pay for capabilities on Tael — in plain language.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${delicious.variable}`} suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
