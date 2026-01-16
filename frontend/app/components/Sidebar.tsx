"use client";
import Link from "next/link";

type SidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function Sidebar({ className = "", onNavigate }: SidebarProps) {
  const base = "w-64 bg-black text-white min-h-full md:min-h-screen p-4";
  return (
    <aside className={`${base} ${className}`}>
      <h2 className="text-xl font-bold mb-6">Inventory</h2>

      <nav className="space-y-3">
        <Link
          href="/"
          className="block hover:text-gray-300"
          onClick={onNavigate}
        >
          Dashboard
        </Link>
        <Link
          href="/forms"
          className="block hover:text-gray-300"
          onClick={onNavigate}
        >
          Forms
        </Link>
      </nav>
    </aside>
  );
}
