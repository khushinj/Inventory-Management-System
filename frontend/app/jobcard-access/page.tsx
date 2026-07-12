"use client";

import Link from "next/link";
import { ClipboardList, LayoutDashboard, FileSpreadsheet } from "lucide-react";

const accessTabs = [
  {
    title: "Create Job Cards",
    description: "Fill and submit a new job card entry",
    href: "/jobcard",
    icon: ClipboardList,
    color: "bg-emerald-600",
  },
  {
    title: "Job Card Dashboard",
    description: "Overview and management of job cards",
    href: "/jobcard-dashboard",
    icon: LayoutDashboard,
    color: "bg-violet-600",
  },
  {
    title: "Performa Invoice",
    description: "Create a PI Excel export linked to job cards",
    href: "/jobcard/performa-invoice",
    icon: FileSpreadsheet,
    color: "bg-amber-600",
  },
];

export default function JobcardAccessPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-900">Job Card Portal</h1>
          <p className="mt-2 text-slate-600">Create and view job cards from here</p>
        </div>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {accessTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tab.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-800">{tab.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{tab.description}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
