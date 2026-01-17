"use client";

import { useState } from "react";
import TransactionForm from "../../components/TransactionForm";
import Link from "next/link";

const formOptions = [
  { value: "dispatch", label: "Dispatch" },
  { value: "production", label: "Production" },
  { value: "purchase", label: "Purchase" },
  { value: "transfer", label: "Transfer" },
  { value: "return", label: "Return" },
  { value: "sample", label: "Sample" },
];

export default function DomesticFormPage() {
  const [formType, setFormType] = useState("dispatch");
  const selection = {
    domain: "warehouse" as const,
    warehouseType: "domestic" as const,
    formType,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 text-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">New Domestic Warehouse Transaction</h1>
            <Link href="/domestic" className="text-green-600 hover:text-green-800 font-medium">
              ← Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-600 mb-4">Manage domestic warehouse transactions</p>
          
          <div className="flex gap-2 flex-wrap">
            {formOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormType(option.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  formType === option.value
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <TransactionForm selection={selection} />
      </div>
    </div>
  );
}
