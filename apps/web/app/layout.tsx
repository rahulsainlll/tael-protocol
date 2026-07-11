import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Delicious_Handrawn, DotGothic16 } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Used only for the hand-drawn "t" in the wordmark and footer watermark.
const delicious = Delicious_Handrawn({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Pixel font used for the small "SECURITY" eyebrow on the CTA card.
const dot = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tael — The payment layer for autonomous AI agents",
  description:
    "Let AI agents pay for APIs, MCP tools, data, and digital services using USDC on Stellar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${delicious.variable} ${dot.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
