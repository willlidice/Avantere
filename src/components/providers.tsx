"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {})
    }
  }, [])

  return (
    <SessionProvider>
      <TooltipProvider delay={300}>{children}</TooltipProvider>
    </SessionProvider>
  );
}
