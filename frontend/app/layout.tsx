"use client";

import "./globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/virgoLogo.png" type="image/png" />
        <link rel="shortcut icon" href="/virgoLogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/virgoLogo.png" />
      </head>
      <body className="bg-gray-100">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}
