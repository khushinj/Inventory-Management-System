"use client";

import Link from "next/link";

const jobCardLinks = [
  {
    title: "Job Card",
    description: "Create and manage job cards for orders",
    href: "/jobcard",
    color: "bg-purple-500",
    hoverColor: "group-hover:text-purple-600",
    textColor: "text-purple-600",
    icon: "📋",
  },
  {
    title: "Job Card Dashboard",
    description: "View and track all job card records",
    href: "/jobcard-dashboard",
    color: "bg-indigo-500",
    hoverColor: "group-hover:text-indigo-600",
    textColor: "text-indigo-600",
    icon: "📊",
  },
];

export default function JobCardFormsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/forms" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to Forms
          </Link>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Card</h1>
          <p className="text-xl text-gray-600">
            Create job cards or view the job card dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {jobCardLinks.map((item) => (
            <Link key={item.href} href={item.href} className="block group">
              <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden h-full">
                <div className={`${item.color} h-2`}></div>
                <div className="p-8">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h2 className={`text-2xl font-semibold text-gray-900 mb-3 ${item.hoverColor} transition-colors`}>
                    {item.title}
                  </h2>
                  <p className="text-gray-600">{item.description}</p>
                  <div className={`mt-6 ${item.textColor} font-medium group-hover:translate-x-2 transition-transform inline-block`}>
                    Open →
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
