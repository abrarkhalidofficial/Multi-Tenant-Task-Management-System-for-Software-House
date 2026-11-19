"use client";

import type React from "react";
import { Suspense } from "react";

import { AuthProvider } from "@/lib/auth/auth-context";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import convex from "@/lib/convex";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConvexProvider client={convex}>
        <ConvexAuthProvider client={convex}>
          <AuthProvider>{children}</AuthProvider>
        </ConvexAuthProvider>
      </ConvexProvider>
    </Suspense>
  );
}
