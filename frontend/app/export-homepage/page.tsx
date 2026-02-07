import Link from "next/link";
import {
  Send,
  Factory,
  ShoppingBag,
  ArrowRightLeft,
  Eye,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

type OperationCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  href?: string;
};

const operations: OperationCard[] = [
  {
    title: "View Inventory",
    description: "Check stock levels and product details",
    icon: Eye,
    bgColor: "bg-blue-500",
    href: "/export-inventory",
  },
  {
    title: "Dispatch",
    description: "Process and send outgoing orders",
    icon: Send,
    bgColor: "bg-emerald-500",
    href: "/export?formType=dispatch",
  },
  {
    title: "Production",
    description: "Track production orders and status",
    icon: Factory,
    bgColor: "bg-orange-500",
    href: "/export?formType=production",
  },
  {
    title: "Purchase",
    description: "Create and manage purchase orders",
    icon: ShoppingBag,
    bgColor: "bg-indigo-500",
    href: "/export?formType=purchase",
  },
  {
    title: "Transfer",
    description: "Handle incoming and outgoing transfers",
    icon: ArrowRightLeft,
    bgColor: "bg-pink-500",
    href: "/export?formType=transfer",
  },
];

export default function ExportOperationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Export Warehouse</h1>
          <p className="text-lg text-gray-600">Select an operation to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operations.map((operation) => {
            const CardContent = (
              <div className="bg-white rounded-xl shadow-md hover:scale-y-101 hover:shadow-xl transition-all duration-300 p-6 flex items-start gap-5 h-full border border-gray-100">
                <div className={`${operation.bgColor} rounded-xl p-4 flex-shrink-0`}>
                  <operation.icon className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {operation.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {operation.description}
                  </p>
                </div>
              </div>
            );

            return operation.href ? (
              <Link
                key={operation.title}
                href={operation.href}
                className="block group focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-200 focus-visible:ring-offset-2 rounded-xl"
              >
                {CardContent}
              </Link>
            ) : (
              <div
                key={operation.title}
                className="opacity-60 cursor-not-allowed"
              >
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
