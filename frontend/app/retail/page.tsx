import Link from "next/link";
import {
  ShoppingCart,
  Package,
  PackageX,
  FileText,
  Warehouse,
} from "lucide-react";
import { LucideIcon } from "lucide-react";



type ActionCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  href?: string;
};

const cards: ActionCard[] = [
  {
    title: "Record Sales",
    description: "Record new sales transactions",
    icon: ShoppingCart,
    gradient: "blue-600",
    href: "/shop?formType=sales",
  },
  {
    title: "Stock Received",
    description: "Record purchase or inbound stock",
    icon: Package,
    gradient: "emerald-600",
    href: "/shop?formType=import",
  },
  {
    title: "Stock Returned",
    description: "Process returned items across channels",
    icon: PackageX,
    gradient: "orange-600",
    href: "/shop?formType=return",
  },
  {
    title: "Daily Report",
    description: "Generate quick summaries (coming soon)",
    icon: FileText,
    gradient: "violet-600",
  },
  {
    title: "View Inventory",
    description: "Check current stock levels (coming soon)",
    icon: Warehouse,
    gradient: "indigo-600",
  },
];


export default function RetailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-bold text-slate-900 md:text-5xl">Inventory Management</h1>
          <p className="text-lg text-slate-600">Select an option to continue</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const content = (
              <div className="relative overflow-hidden rounded-2xl shadow-lg transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:-translate-y-1">
                <div className={`absolute inset-0 bg-${card.gradient}`} />
                <div
                  className="absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-white/15 blur-3xl"
                  aria-hidden
                />
                <div className="relative p-8 text-white">
                  <div className="flex items-center justify-between">
                    <card.icon className="w-16 h-16" aria-hidden />
                  </div>
                  <h2 className="mt-8 text-2xl font-bold leading-tight">{card.title}</h2>
                  <p className="mt-3 text-sm text-white/90">{card.description}</p>
                </div>
              </div>
            );

            return card.href ? (
              <Link key={card.title} href={card.href} className="group block focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50">
                {content}
              </Link>
            ) : (
              <div
                key={card.title}
                className="group block cursor-not-allowed opacity-80"
                aria-disabled
              >
                {content}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
