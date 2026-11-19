"use client";

import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ReactNode } from "react";

// Create the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexProvider({ children }: { children: ReactNode }) {
  return (
    // @ts-ignore
    <ConvexProviderWithAuth client={convex}>
      <ConvexAuthNextjsProvider client={convex}>
        {children}
      </ConvexAuthNextjsProvider>
    </ConvexProviderWithAuth>
  );
}
