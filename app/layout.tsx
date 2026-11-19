"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider } from "@/lib/auth/auth-context";

const inter = Inter({ subsets: ["latin"] });

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ConvexProvider client={convex}>{children}</ConvexProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
