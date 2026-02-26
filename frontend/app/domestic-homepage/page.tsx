"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Send,
  TestTube,
  Factory,
  ShoppingBag,
  Store,
  Undo2,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { api } from "../../lib/api";

type OperationCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  bgColor: string;
  href?: string;
};

type PurchaseOrder = {
  _id: string;
  buyerName: string;
  dealerName: string;
  date: string;
  city: string;
  totalQuantity: number;
  grandTotal: number;
  createdAt: string;
};

const operations: OperationCard[] = [
  {
    title: "View Inventory",
    description: "Check stock levels and product details",
    icon: Package,
    bgColor: "bg-blue-500",
    href: "/domestic-inventory",
  },
  {
    title: "Dispatch",
    description: "Process and send outgoing orders",
    icon: Send,
    bgColor: "bg-emerald-500",
    href: "/domestic?formType=dispatch&locked=true",
  },
  {
    title: "Sample",
    description: "Manage product samples",
    icon: TestTube,
    bgColor: "bg-purple-500",
    href: "/domestic?formType=sample&locked=true",
  },
  {
    title: "Production",
    description: "Track production orders and status",
    icon: Factory,
    bgColor: "bg-orange-500",
    href: "/domestic?formType=production&locked=true",
  },
  {
    title: "Purchase",
    description: "Create and manage purchase orders",
    icon: ShoppingBag,
    bgColor: "bg-indigo-500",
    href: "/domestic?formType=purchase&locked=true",
  },
  {
    title: "Purchase Order",
    description: "Generate purchase orders with invoices",
    icon: FileText,
    bgColor: "bg-amber-500",
    href: "/domestic/purchase-order",
  },
  {
    title: "Online Sale",
    description: "Process online sales orders",
    icon: Store,
    bgColor: "bg-teal-500",
    href: "/domestic-online-sales",
  },
  {
    title: "Return",
    description: "Handle product returns",
    icon: Undo2,
    bgColor: "bg-red-500",
    href: "/domestic?formType=return&locked=true",
  },
  {
    title: "Transfer Inward",
    description: "Receive incoming transfers",
    icon: ArrowDownToLine,
    bgColor: "bg-cyan-500",
    href: "/domestic?formType=transfer inwards&locked=true",
  },
  {
    title: "Transfer Outward",
    description: "Send outgoing transfers",
    icon: ArrowUpFromLine,
    bgColor: "bg-pink-500",
    href: "/domestic?formType=transfer outwards&locked=true",
  },
];

export default function DomesticOperationsPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await api.get("/purchase-order");
      if (response.data.success) {
        setPurchaseOrders(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Domestic Warehouse</h1>
            <p className="text-lg text-gray-600">Select an operation to get started</p>
          </div>
          <button
            onClick={() => router.push("/purchase-order-dashboard")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Purchase Orders
          </button>
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