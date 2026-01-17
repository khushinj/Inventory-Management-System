"use client";
import "./../globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex flex-col min-h-screen">
          <header className="bg-black text-white shadow p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Shop - Inventory Management</h1>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
