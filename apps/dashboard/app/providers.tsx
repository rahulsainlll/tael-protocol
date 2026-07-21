"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      {/* Toasts follow the app theme; subtle, dismissible, bottom-right. */}
      <Toaster theme="system" richColors closeButton position="bottom-right" />
    </ThemeProvider>
  );
}
