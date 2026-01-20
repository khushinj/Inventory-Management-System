"use client";
import "./../globals.css";
import type { ReactNode } from "react";

export default function DomesticLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white shadow p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Domestic Warehouse - Inventory Management</h1>
        </div>
      </header>
      <section className="flex-1" role="main">{children}</section>
    </div>
  );
}
