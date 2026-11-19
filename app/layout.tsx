"use client";

import type React from "react";

import { useSearchParams } from "next/navigation";
import ClientLayout from "./ClientLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const searchParams = useSearchParams();

  return <ClientLayout>{children}</ClientLayout>;
}

import "./globals.css";
