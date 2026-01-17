"use client";
import "./../globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function OnlineLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <html lang="en">
      <body className="bg-gray-100">
        <div className="flex flex-col min-h-screen">
          <header className="bg-orange-600 text-white shadow p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">Online Warehouse - Inventory Management</h1>
              <nav className="flex gap-4">
                <Link href="/online" className={`hover:text-gray-300 ${pathname === '/online' ? 'font-bold' : ''}`}>
                  Dashboard
                </Link>
                <Link href="/online/form" className={`hover:text-gray-300 ${pathname === '/online/form' ? 'font-bold' : ''}`}>
                  New Transaction
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
