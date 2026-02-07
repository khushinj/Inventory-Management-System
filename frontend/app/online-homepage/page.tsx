"use client";

import Link from "next/link";
import { Eye, Undo2, ShoppingCart, ArrowRightLeft, ShoppingBag } from "lucide-react";

const operations = [
  {
    title: "View Inventory",
    description: "Browse and search product catalog",
    icon: Eye,
    href: "/online-inventory",
    color: "bg-orange-500",
    hoverColor: "hover:bg-orange-600",
  },
  {
    title: "Return",
    description: "Process customer returns",
    icon: Undo2,
    href: "/online?formType=return",
    color: "bg-red-500",
    hoverColor: "hover:bg-red-600",
  },
  {
    title: "Sales",
    description: "Record online sales transactions",
    icon: ShoppingCart,
    href: "/online?formType=sales",
    color: "bg-green-500",
    hoverColor: "hover:bg-green-600",
  },
  {
    title: "Transfer",
    description: "Manage inventory transfers",
    icon: ArrowRightLeft,
    href: "/online?formType=transfer",
    color: "bg-blue-500",
    hoverColor: "hover:bg-blue-600",
  },
  {
    title: "Purchase",
    description: "Record online purchases",
    icon: ShoppingBag,
    href: "/online?formType=purchase",
    color: "bg-purple-500",
    hoverColor: "hover:bg-purple-600",
  },
];

export default function OnlineHomepage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Online Warehouse Operations
          </h1>
          <p className="text-xl text-gray-600">
            Select an operation to manage online warehouse transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {operations.map((operation) => {
            const Icon = operation.icon;
            return (
              <Link
                key={operation.href}
                href={operation.href}
                className="block group"
              >
                <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                  <div className={`${operation.color} h-2`}></div>
                  <div className="p-6">
                    <div className="flex items-center mb-4">
                      <div className={`${operation.color} ${operation.hoverColor} p-3 rounded-lg transition-colors`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                      {operation.title}
                    </h2>
                    <p className="text-gray-600">{operation.description}</p>
                    <div className="mt-4 text-orange-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
                      Open →
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
