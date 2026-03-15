"use client";

import Link from "next/link";
import { Package, Store, MonitorSmartphone, FileText, BarChart3 } from "lucide-react";

const accessTabs = [
  {
    title: "Shop Inventory",
    description: "View shop inventory",
    href: "/shop-inventory",
    icon: Store,
    color: "bg-blue-600",
  },
  {
    title: "Domestic Inventory",
    description: "View domestic inventory",
    href: "/domestic-inventory",
    icon: Package,
    color: "bg-emerald-600",
  },
  {
    title: "Online Inventory",
    description: "View e-commerce inventory",
    href: "/online-inventory",
    icon: MonitorSmartphone,
    color: "bg-violet-600",
  },
  {
    title: "Create Purchase Order",
    description: "Create domestic purchase orders",
    href: "/domestic/purchase-order",
    icon: FileText,
    color: "bg-orange-600",
  },
  {
    title: "Purchase Order Dashboard",
    description: "Track and manage purchase orders",
    href: "/purchase-order-dashboard",
    icon: BarChart3,
    color: "bg-pink-600",
  },
];

export default function InventoryPoAccessPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900">Inventory & Purchase Order Access</h1>
          <p className="mt-2 text-slate-600">Access only the allowed tabs below</p>
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {accessTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tab.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">{tab.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{tab.description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
