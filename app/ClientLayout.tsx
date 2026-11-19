"use client";

import type React from "react";

import { Analytics } from "@vercel/analytics/next";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexProvider } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { Suspense } from "react";
import "./globals.css";
import convex from "@/lib/convex/client";

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <ConvexProvider client={convex}>
            <ConvexAuthProvider client={convex}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </ConvexAuthProvider>
          </ConvexProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
