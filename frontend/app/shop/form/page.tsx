"use client";

import { useState } from "react";
import TransactionForm from "../../components/TransactionForm";
import Link from "next/link";

export default function ShopFormPage() {
  const [selection] = useState({
    domain: "shop" as const,
    warehouseType: "" as const,
    formType: "import",
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">New Shop Transaction</h1>
            <Link href="/shop" className="text-blue-600 hover:text-blue-800 font-medium">
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-600">Record shop sales and inventory movements</p>
        </div>
        <TransactionForm selection={selection} />
      </div>
    </div>
  );
}
