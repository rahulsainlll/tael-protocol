import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tael — The payment layer for autonomous AI agents",
  description:
    "Let AI agents pay for APIs, MCP tools, data, and digital services using USDC on Stellar.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
