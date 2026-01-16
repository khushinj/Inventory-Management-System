"use client";
import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-black text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-6">Inventory</h2>

      <nav className="space-y-3">
        <Link href="/" className="block hover:text-gray-300">
          Dashboard
        </Link>
        <Link href="/forms" className="block hover:text-gray-300">
          Forms
        </Link>
      </nav>
    </aside>
  );
}
