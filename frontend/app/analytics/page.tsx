"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Globe, House, ShoppingBag, Zap, Store, MonitorSmartphone, ClipboardList } from "lucide-react";
import type { ComponentType } from "react";
import { api } from "../../lib/api";

type CardItem = {
  title: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
};

type RecentActivityItem = {
  id: string;
  area: "shop" | "domestic" | "online" | string;
  source: string;
  activityType: string;
  date: string | null;
  activityAt: string | null;
  designNumber: string | null;
  quantity: number;
  amount: number | null;
  channel: string | null;
  platform: string | null;
};

type DisplayActivityItem = RecentActivityItem & {
  displayTime: string;
  displayDate: string;
  displayAmount: string;
  displayArea: string;
  displayType: string;
};

const analyticsCards: CardItem[] = [
  {
    title: "Shop",
    href: "/shop-analytics",
    icon: ShoppingBag,
    iconBg: "bg-blue-600",
    iconColor: "text-white",
  },
  {
    title: "E-commerce",
    href: "/ecommerce-analytics",
    icon: Globe,
    iconBg: "bg-violet-600",
    iconColor: "text-white",
  },
  {
    title: "Domestic",
    href: "/domestic-analytics",
    icon: House,
    iconBg: "bg-emerald-600",
    iconColor: "text-white",
  },
  {
    title: "Export/FOB",
    href: "/forms",
    icon: Zap,
    iconBg: "bg-orange-500",
    iconColor: "text-white",
  },
  {
    title: "Purchase Orders",
    href: "/purchase-order-dashboard",
    icon: ClipboardList,
    iconBg: "bg-cyan-600",
    iconColor: "text-white",
  },
  {
    title: "Job Card Dashboard",
    href: "/jobcard-dashboard",
    icon: ClipboardList,
    iconBg: "bg-slate-700",
    iconColor: "text-white",
  },
];

const inventoryCards: CardItem[] = [
  {
    title: "Domestic",
    href: "/domestic-inventory",
    icon: House,
    iconBg: "bg-indigo-600",
    iconColor: "text-white",
  },
  {
    title: "Shop",
    href: "/shop-inventory",
    icon: Store,
    iconBg: "bg-pink-600",
    iconColor: "text-white",
  },
  {
    title: "Online",
    href: "/online-inventory",
    icon: MonitorSmartphone,
    iconBg: "bg-teal-600",
    iconColor: "text-white",
  },
];

function SectionTitle({ label }: { label: string }) {
  return (
    <div className="mb-7 flex items-center gap-4">
      <span className="h-12 w-1 rounded-full bg-gradient-to-b from-blue-500 to-fuchsia-500" />
      <h2 className="text-4xl font-bold tracking-tight text-slate-800">{label}</h2>
    </div>
  );
}

function DashboardCard({ item }: { item: CardItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="mb-10 flex items-start justify-between gap-4">
        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${item.iconBg}`}>
          <Icon className={`h-7 w-7 ${item.iconColor}`} />
        </div>
      </div>

      <h3 className="text-3xl font-semibold text-slate-700 transition-colors group-hover:text-slate-900">{item.title}</h3>
    </Link>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateOnly(value: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function areaLabel(value: string) {
  if (value === "shop") return "Shop";
  if (value === "domestic") return "Domestic";
  if (value === "online") return "Online";
  return value;
}

function ActivityTable({
  title,
  rows,
  titleClassName,
}: {
  title: string;
  rows: DisplayActivityItem[];
  titleClassName: string;
}) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filterOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.activityType))).filter(Boolean);
  }, [rows]);

  useEffect(() => {
    if (activeFilter && !filterOptions.includes(activeFilter)) {
      setActiveFilter(null);
    }
  }, [activeFilter, filterOptions]);

  const filteredRows = useMemo(() => {
    if (!activeFilter) return rows;
    return rows.filter((item) => item.activityType === activeFilter);
  }, [rows, activeFilter]);

  const formatFilterLabel = (value: string) => value.replace(/-/g, " ");

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={`px-6 py-4 text-4xl font-bold tracking-tight text-white ${titleClassName}`}>{title}</div>
      {rows.length === 0 ? (
        <div className="px-6 py-8 text-sm font-medium text-slate-600">No activity in last 24 hours.</div>
      ) : (
        <div>
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-3">
            {filterOptions.map((option) => {
              const isActive = activeFilter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setActiveFilter(isActive ? null : option)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                    isActive
                      ? "bg-slate-800 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {formatFilterLabel(option)}
                </button>
              );
            })}
          </div>

          <div className="h-[560px] overflow-auto">
            <table className="min-w-[760px] divide-y divide-slate-200">
              <thead className="sticky top-0 bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Activity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Design/Ref</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Record Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Activity Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-sm font-medium text-slate-500">
                      No entries for selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.displayType}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.designNumber || item.source}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">{item.quantity || 0}</td>
                      <td className="px-4 py-3 text-right text-sm text-slate-700">{item.displayAmount}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.displayDate}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.displayTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setLoadingRecent(true);
        const response = await api.get("/analytics/recent-activity", {
          params: { hours: 24 },
        });
        const rows = response.data?.data?.activities;
        setRecentActivities(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error("Error loading recent activity:", error);
        setRecentActivities([]);
      } finally {
        setLoadingRecent(false);
      }
    };

    fetchRecentActivity();
  }, []);

  const activityRows = useMemo(() => {
    return recentActivities.map((item) => ({
      ...item,
      displayTime: formatDateTime(item.activityAt),
      displayDate: formatDateOnly(item.date),
      displayAmount: formatAmount(item.amount),
      displayArea: areaLabel(item.area),
      displayType: item.activityType?.replace(/-/g, " ") || "activity",
    }));
  }, [recentActivities]);

  const groupedActivities = useMemo(() => {
    return {
      shop: activityRows.filter((item) => item.area.toLowerCase() === "shop"),
      domestic: activityRows.filter((item) => item.area.toLowerCase() === "domestic"),
      online: activityRows.filter((item) => item.area.toLowerCase() === "online"),
    };
  }, [activityRows]);

  return (
    <main className="min-h-screen bg-slate-200 px-6 py-8 sm:px-10 lg:px-12">
      <div className="mx-auto w-full max-w-[1400px]">
        <SectionTitle label="Analytics" />
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {analyticsCards.map((item) => (
            <DashboardCard key={item.title} item={item} />
          ))}
        </section>

        <div className="mt-20">
          <SectionTitle label="Inventory" />
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {inventoryCards.map((item) => (
              <DashboardCard key={item.title} item={item} />
            ))}
          </section>
        </div>

        <div className="mt-20">
          <SectionTitle label="Last 24 Hours Activity" />
          {loadingRecent ? (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-blue-600 px-6 py-4 text-4xl font-bold tracking-tight text-white">Shop</div>
                <div className="px-6 py-8 text-sm font-medium text-slate-600">Loading recent activity...</div>
              </section>
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-emerald-600 px-6 py-4 text-4xl font-bold tracking-tight text-white">Domestic</div>
                <div className="px-6 py-8 text-sm font-medium text-slate-600">Loading recent activity...</div>
              </section>
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-violet-600 px-6 py-4 text-4xl font-bold tracking-tight text-white">Online</div>
                <div className="px-6 py-8 text-sm font-medium text-slate-600">Loading recent activity...</div>
              </section>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <ActivityTable title="Shop" rows={groupedActivities.shop} titleClassName="bg-blue-600" />
              <ActivityTable title="Domestic" rows={groupedActivities.domestic} titleClassName="bg-emerald-600" />
              <ActivityTable title="Online" rows={groupedActivities.online} titleClassName="bg-violet-600" />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
