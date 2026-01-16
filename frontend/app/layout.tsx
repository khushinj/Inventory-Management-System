"use client";
import "./globals.css";
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function RootLayout({ children }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex min-h-screen">
          <Sidebar className="hidden md:block" />

          <div className="flex-1 flex flex-col">
            <Header onMenuClick={() => setMobileNavOpen(true)} />
            <main className="p-4 sm:p-6 flex-1">{children}</main>
          </div>
        </div>

        {/* Mobile overlay nav */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileNavOpen(false)}
            />
            <Sidebar
              className="relative z-50 w-72 max-w-[85vw]"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </div>
        )}
      </body>
    </html>
  );
}
