"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";

// Class-based theme, defaults to light. Only the docs use `dark:` variants and
// expose the toggle; the marketing pages have no dark styles so they're
// unaffected by the theme class.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
