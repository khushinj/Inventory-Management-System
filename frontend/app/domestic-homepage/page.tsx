"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
    href: "/inventory",
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
    href: "/online?formType=sales",
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
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Domestic Warehouse</h1>
          <p className="text-lg text-gray-600">Select an operation to get started</p>
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

        {/* Purchase Orders Records Section */}
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Records</h2>
            <p className="text-gray-600">Recent purchase orders</p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading records...</p>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No purchase orders found</p>
              <p className="text-sm text-gray-500 mt-1">Create your first purchase order to see it here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {purchaseOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-4 border border-gray-100"
                >                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Buyer</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {order.buyerName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(order.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">Total</span>
                        <span className="text-sm font-bold text-gray-900">
                          ₹{order.grandTotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-500">Qty</span>
                        <span className="text-xs font-medium text-gray-700">
                          {order.totalQuantity} pcs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
