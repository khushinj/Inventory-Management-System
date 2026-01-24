"use client";

import "./globals.css";
import type { ReactNode } from "react";
import { useBackendPing } from "./hooks/useBackendPing";

export default function RootLayout({ children }: { children: ReactNode }) {
  useBackendPing();

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
