"use client";

import Link from "next/link";
import {
  FileText,
  Boxes,
  Activity,
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
    title: "Shipped Order",
    description: "Manage orders and their production status",
    icon: FileText,
    bgColor: "bg-slate-600",
    href: "/export-fob/shipped-order",
  },
  {
    title: "Present Stock",
    description: "Track inventory across production stages",
    icon: Boxes,
    bgColor: "bg-violet-500",
    href: "/present-stock",
  },
  {
    title: "Production Tracking",
    description: "Monitor quantities across production stages",
    icon: Activity,
    bgColor: "bg-blue-500",
    href: "/production-tracking",
  },
];

export default function ExportFobPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Export/FOB</h1>
            <p className="text-lg text-gray-600">Select an operation to get started</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
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
                className="block group focus:outline-none focus-visible:ring-4 focus-visible:ring-green-200 focus-visible:ring-offset-2 rounded-xl"
              >
                {CardContent}
              </Link>
            ) : (
              <div
                key={operation.title}
                className="block group focus:outline-none focus-visible:ring-4 focus-visible:ring-green-200 focus-visible:ring-offset-2 rounded-xl cursor-not-allowed opacity-50"
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
