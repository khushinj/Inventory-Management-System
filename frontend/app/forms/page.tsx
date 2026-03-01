"use client";

import Link from "next/link";

const formTypes = [
  {
    title: "Shop",
    description: "Record shop sales and inventory movements",
    href: "/retail",
    color: "bg-blue-500",
  },
  {
    title: "Domestic Warehouse",
    description: "Manage domestic warehouse transactions",
    href: "/domestic-homepage",
    color: "bg-green-500",
  },
  {
    title: "E-Commerce / Online Warehouse",
    description: "Manage online warehouse transactions",
    href: "/online-homepage",
    color: "bg-orange-500",
  }
];

export default function FormsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Select Form Type
          </h1>
          <p className="text-xl text-gray-600">
            Choose the appropriate form for your transaction
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {formTypes.map((form) => (
            <Link
              key={form.href}
              href={form.href}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
                <div className={`${form.color} h-2`}></div>
                <div className="p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {form.title}
                  </h2>
                  <p className="text-gray-600">{form.description}</p>
                  <div className="mt-4 text-blue-600 font-medium group-hover:translate-x-2 transition-transform inline-block">
                    Open Form →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}