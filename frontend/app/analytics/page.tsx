"use client";

import Link from "next/link";
import { Globe, House, ShoppingBag, Zap, Store, MonitorSmartphone } from "lucide-react";
import type { ComponentType } from "react";

type CardItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

const analyticsCards: CardItem[] = [
  {
    title: "Shop",
    href: "/shop-analytics",
    icon: ShoppingBag,
    iconBg: "bg-blue-600",
    iconColor: "text-white",
  },
  {
    title: "E-commerce",
    href: "/ecommerce-analytics",
    icon: Globe,
    iconBg: "bg-violet-600",
    iconColor: "text-white",
  },
  {
    title: "Domestic",
    href: "/domestic-analytics",
    icon: House,
    iconBg: "bg-emerald-600",
    iconColor: "text-white",
  },
  {
    title: "Export/FOB",
    href: "/forms",
    icon: Zap,
    iconBg: "bg-orange-500",
    iconColor: "text-white",
  },
];

const inventoryCards: CardItem[] = [
  {
    title: "Domestic",
    href: "/domestic-inventory",
    icon: House,
    iconBg: "bg-indigo-600",
    iconColor: "text-white",
  },
  {
    title: "Shop",
    href: "/shop-inventory",
    icon: Store,
    iconBg: "bg-pink-600",
    iconColor: "text-white",
  },
  {
    title: "Online",
    href: "/online-inventory",
    icon: MonitorSmartphone,
    iconBg: "bg-teal-600",
    iconColor: "text-white",
  },
];

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="mb-7 flex items-center gap-4">
      <span className="h-12 w-1 rounded-full bg-gradient-to-b from-blue-500 to-fuchsia-500" />
      <h2 className="text-4xl font-bold tracking-tight text-slate-800">{label}</h2>
    </div>
  );
}

function DashboardCard({ item }: { item: CardItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-10 flex items-start justify-between gap-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg}`}>
          <Icon className={`h-7 w-7 ${item.iconColor}`} />
        </div>
      </div>

      <h3 className="text-3xl font-semibold text-slate-700 transition-colors group-hover:text-slate-900">{item.title}</h3>
    </Link>
  );
}

export default function AnalyticsPage() {
  return (
    <main className="min-h-screen bg-slate-200 px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <SectionTitle label="Analytics" />
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((item) => (
            <DashboardCard key={item.title} item={item} />
          ))}
        </section>

        <div className="mt-20">
          <SectionTitle label="Inventory" />
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {inventoryCards.map((item) => (
              <DashboardCard key={item.title} item={item} />
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
