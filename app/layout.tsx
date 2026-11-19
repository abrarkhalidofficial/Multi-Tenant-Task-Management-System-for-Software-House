import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";
import { ThemeProvider } from "@/components/theme-provider";
import { ConvexProvider } from "./convex-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}

export const metadata = {
  generator: "v0.app",
};
