"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      {/* Clean, neutral toasts that match the app surface (no heavy color fills).
          A green tick for success comes from the icon, not the background. */}
      <Toaster
        theme="system"
        position="bottom-right"
        gap={8}
        toastOptions={{
          classNames: {
            toast:
              "!rounded-xl !border !border-border !bg-popover !text-popover-foreground !shadow-lg",
            title: "!text-sm !font-medium",
            description: "!text-muted-foreground",
            success: "!text-foreground [&_[data-icon]]:!text-emerald-600",
            error: "!text-foreground [&_[data-icon]]:!text-destructive",
            closeButton: "!bg-popover !border-border !text-muted-foreground",
          },
        }}
      />
    </ThemeProvider>
  );
}
