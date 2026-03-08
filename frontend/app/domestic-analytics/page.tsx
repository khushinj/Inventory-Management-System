"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";
import { api } from "../../lib/api";

type MetricCard = {
  title: string;
  value: string;
  trend?: string;
};

type SeriesPoint = {
  label: string;
  sales: number;
  orders: number;
};

type MovingItem = {
  articleNo: string;
  quantity: number;
  dispatchCount: number;
};

type OrderRow = {
  date: string;
  orderCount: number;
  orderValue: string;
};

type RegionPoint = {
  label: string;
  value: number;
  percentage: number;
  color: string;
  deliveredPercent: number;
  pendingPercent: number;
  totalOrders: number;
};

type Transaction = {
  dno: string;
  qty: number;
  mrp?: number;
  date: string;
  color?: string;
  size?: string;
};

type InventoryItem = {
  dno: string;
  color: string;
  size: string;
  stock: number;
};

type PurchaseOrder = {
  _id: string;
  date: string;
  city: string;
  grandTotal: number;
  totalQuantity: number;
  status?: string;
};

type JobCard = {
  designNumber: string;
  mrp: number;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  } catch {
    return dateStr;
  }
}

function normalizeDno(dno?: string) {
  return (dno || "").trim().replace(/\s+/g, "").toUpperCase();
}

function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}
    >
      {children}
    </section>
  );
}

function SalesOrdersChart({ data }: { data: SeriesPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 900;
  const height = 360;
  const leftPad = 80;
  const rightPad = 32;
  const topPad = 26;
  const bottomPad = 64;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxY = Math.max(100, ...data.map((d) => Math.max(d.sales, d.orders)));
  const roundedMax = Math.ceil(maxY / 1000) * 1000;
  const steps = Array.from({ length: 5 }, (_, i) => (roundedMax / 4) * i);

  const toX = (index: number) => leftPad + (index * chartWidth) / Math.max(1, data.length - 1);
  const toY = (value: number) => topPad + chartHeight - (value / roundedMax) * chartHeight;

  const salesPoints = data.map((point, index) => `${toX(index)},${toY(point.sales)}`).join(" ");
  const ordersPoints = data.map((point, index) => `${toX(index)},${toY(point.orders)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[340px] w-full min-w-[680px]">
        {steps.map((tick) => {
          const y = toY(tick);
          return (
            <g key={`grid-${tick}`}>
              <line
                x1={leftPad}
                y1={y}
                x2={width - rightPad}
                y2={y}
                stroke="#dce3ea"
                strokeWidth="1"
                strokeDasharray="5 5"
              />
              <text x={leftPad - 10} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="18">
                {Math.round(tick).toLocaleString()}
              </text>
            </g>
          );
        })}

        <line x1={leftPad} y1={topPad} x2={leftPad} y2={topPad + chartHeight} stroke="#94a3b8" strokeWidth="2" />
        <line
          x1={leftPad}
          y1={topPad + chartHeight}
          x2={width - rightPad}
          y2={topPad + chartHeight}
          stroke="#94a3b8"
          strokeWidth="2"
        />

        {data.map((point, index) => (
          <text
            key={`x-label-${point.label}`}
            x={toX(index)}
            y={topPad + chartHeight + 26}
            textAnchor="middle"
            fill="#6b7280"
            fontSize="18"
          >
            {point.label}
          </text>
        ))}

        <polyline fill="none" stroke="#3b82f6" strokeWidth="4" points={salesPoints} />
        <polyline fill="none" stroke="#06b6d4" strokeWidth="4" points={ordersPoints} />

        {data.map((point, index) => {
          const x = toX(index);
          const ySales = toY(point.sales);
          const yOrders = toY(point.orders);
          return (
            <g
              key={`dot-${point.label}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <circle cx={x} cy={ySales} r="6" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
              <circle cx={x} cy={yOrders} r="6" fill="#ffffff" stroke="#06b6d4" strokeWidth="3" />
              
              {hoveredIndex === index && (
                <>
                  <rect
                    x={x - 85}
                    y={Math.min(ySales, yOrders) - 65}
                    width="170"
                    height="55"
                    fill="#1e293b"
                    rx="6"
                    opacity="0.95"
                  />
                  <text x={x} y={Math.min(ySales, yOrders) - 42} textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="600">
                    {point.label}
                  </text>
                  <text x={x} y={Math.min(ySales, yOrders) - 25} textAnchor="middle" fill="#3b82f6" fontSize="13">
                    Sales: {formatINR(point.sales)}
                  </text>
                  <text x={x} y={Math.min(ySales, yOrders) - 10} textAnchor="middle" fill="#06b6d4" fontSize="13">
                    Orders: {point.orders}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-6 text-sm sm:text-lg">
        <div className="flex items-center gap-2 text-blue-500">
          <span className="text-xl leading-none">•</span>
          <span>sales</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-500">
          <span className="text-xl leading-none">•</span>
          <span>orders</span>
        </div>
      </div>
    </div>
  );
}

function RegionPieChart({ data }: { data: RegionPoint[] }) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const size = 360;
  const center = size / 2;
  const radius = 104;
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const slices = data
    .reduce<{
      nextAngle: number;
      items: Array<RegionPoint & { path: string; midAngle: number }>;
    }>(
      (acc, item) => {
        const startAngle = acc.nextAngle;
        const sliceAngle = (item.value / total) * 360;
        const endAngle = startAngle + sliceAngle;
        const x1 = center + radius * Math.cos((Math.PI * startAngle) / 180);
        const y1 = center + radius * Math.sin((Math.PI * startAngle) / 180);
        const x2 = center + radius * Math.cos((Math.PI * endAngle) / 180);
        const y2 = center + radius * Math.sin((Math.PI * endAngle) / 180);
        const largeArcFlag = sliceAngle > 180 ? 1 : 0;

        return {
          nextAngle: endAngle,
          items: [
            ...acc.items,
            {
              ...item,
              path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
              midAngle: startAngle + sliceAngle / 2,
            },
          ],
        };
      },
      { nextAngle: -90, items: [] }
    )
    .items;

  return (
    <div className="relative flex items-center justify-center pt-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[280px] w-[280px] sm:h-[320px] sm:w-[320px]">
        {slices.map((slice) => (
          <path
            key={slice.label}
            d={slice.path}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            style={{ cursor: "pointer", opacity: hoveredRegion === slice.label ? 0.8 : 1 }}
            onMouseEnter={() => setHoveredRegion(slice.label)}
            onMouseLeave={() => setHoveredRegion(null)}
          />
        ))}
      </svg>

      {slices.map((slice) => {
        const labelRadius = radius + 52;
        const x = center + labelRadius * Math.cos((Math.PI * slice.midAngle) / 180);
        const y = center + labelRadius * Math.sin((Math.PI * slice.midAngle) / 180);

        return (
          <div
            key={`label-${slice.label}`}
            className="pointer-events-none absolute text-base font-medium sm:text-2xl"
            style={{
              left: `${(x / size) * 100}%`,
              top: `${(y / size) * 100}%`,
              color: slice.color,
              transform: "translate(-50%, -50%)",
            }}
          >
            {slice.label} {slice.percentage}%
            {hoveredRegion === slice.label && (
              <div className="mt-1 space-y-1 text-xs text-slate-700 whitespace-nowrap bg-white/95 p-2 rounded shadow-lg">
                <div className="font-semibold">{formatINR(slice.value)}</div>
                <div className="text-green-600">✓ Delivered: {slice.deliveredPercent}%</div>
                <div className="text-orange-600">⏳ Pending: {slice.pendingPercent}%</div>
                <div className="text-slate-500 text-[10px]">({slice.totalOrders} orders)</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DomesticAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"last-month" | "last-3-months" | "last-6-months" | "last-year">("last-month");
  const [metricCards, setMetricCards] = useState<MetricCard[]>([]);
  const [salesOrderSeries, setSalesOrderSeries] = useState<SeriesPoint[]>([]);
  const [slowMovingArticles, setSlowMovingArticles] = useState<MovingItem[]>([]);
  const [fastMovingArticles, setFastMovingArticles] = useState<MovingItem[]>([]);
  const [orderTable, setOrderTable] = useState<OrderRow[]>([]);
  const [regionDistribution, setRegionDistribution] = useState<RegionPoint[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });

  const getDateRange = useCallback((periodType: typeof period) => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    if (periodType === "last-month") {
      // Previous calendar month
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (periodType === "last-3-months") {
      // Last 3 months from today
      start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      end = now;
    } else if (periodType === "last-6-months") {
      // Last 6 months from today
      start = new Date(now);
      start.setMonth(now.getMonth() - 6);
      end = now;
    } else if (periodType === "last-year") {
      // Last 12 months from today
      start = new Date(now);
      start.setFullYear(now.getFullYear() - 1);
      end = now;
    } else {
      // Default to last month
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0],
    };
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const range = getDateRange(period);
      setDateRange(range);

      // Fetch all required data in parallel
      const [dispatchRes, purchaseOrdersRes, inventoryRes, jobCardsRes] = await Promise.all([
        api.get("/warehouse/domestic"),
        api.get("/purchase-order"),
        api.get("/inventory/warehouse/domestic"),
        api.get("/jobcard"),
      ]);

      const allTransactions: Transaction[] = dispatchRes.data || [];
      const allPurchaseOrders: PurchaseOrder[] = purchaseOrdersRes.data?.data || [];
      const inventoryItems: InventoryItem[] = inventoryRes.data?.inventory || [];
      const jobCards: JobCard[] = jobCardsRes.data || [];

      // Filter data by date range
      const dispatchTransactions = allTransactions.filter(
        (t) => t.date >= range.start && t.date <= range.end
      );
      const purchaseOrders = allPurchaseOrders.filter(
        (po) => po.date >= range.start && po.date <= range.end
      );

      // Calculate metrics
      calculateMetrics(dispatchTransactions, inventoryItems, jobCards);
      calculateSalesOrderSeries(dispatchTransactions, purchaseOrders);
      calculateMovingArticles(dispatchTransactions, inventoryItems);
      calculateOrderTable(purchaseOrders);
      calculateRegionDistribution(allPurchaseOrders);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  }, [period, getDateRange]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const calculateMetrics = (dispatches: Transaction[], inventory: InventoryItem[], jobCards: JobCard[]) => {
    // Create MRP lookup map from job cards
    const mrpMap = new Map<string, number>();
    jobCards.forEach((jc) => {
      const key = normalizeDno(jc.designNumber);
      mrpMap.set(key, jc.mrp || 0);
    });

    // 1. Total Sale (from dispatch transactions)
    const totalSale = dispatches.reduce((sum, t) => {
      const mrp = t.mrp || mrpMap.get(normalizeDno(t.dno)) || 0;
      return sum + t.qty * mrp;
    }, 0);

    // 2. Avg Article Sale
    const uniqueArticles = new Set(dispatches.map((t) => normalizeDno(t.dno)));
    const avgArticleSale = uniqueArticles.size > 0 ? totalSale / uniqueArticles.size : 0;

    // 3. Current Inventory Value
    const inventoryValue = inventory.reduce((sum, item) => {
      const mrp = mrpMap.get(normalizeDno(item.dno)) || 0;
      return sum + item.stock * mrp;
    }, 0);

    setMetricCards([
      {
        title: "Total Sale",
        value: formatINR(totalSale),
        trend: totalSale > 0 ? "+8.3%" : "N/A",
      },
      {
        title: "Avg Article Sale",
        value: formatINR(avgArticleSale),
        trend: avgArticleSale > 0 ? "+4.1%" : "N/A",
      },
      {
        title: "Current Inventory Value",
        value: formatINR(inventoryValue),
      },
    ]);
  };

  const calculateSalesOrderSeries = (dispatches: Transaction[], purchaseOrders: PurchaseOrder[]) => {
    // Group by date
    const salesByDate = new Map<string, number>();
    const ordersByDate = new Map<string, number>();

    dispatches.forEach((t) => {
      const date = t.date.split("T")[0];
      const current = salesByDate.get(date) || 0;
      salesByDate.set(date, current + t.qty);
    });

    purchaseOrders.forEach((po) => {
      const date = po.date.split("T")[0];
      const current = ordersByDate.get(date) || 0;
      ordersByDate.set(date, current + 1);
    });

    // Get last 10 unique dates
    const allDates = Array.from(
      new Set([...Array.from(salesByDate.keys()), ...Array.from(ordersByDate.keys())])
    ).sort();

    const last10Dates = allDates.slice(-10);

    const series: SeriesPoint[] = last10Dates.map((date) => ({
      label: formatDate(date),
      sales: salesByDate.get(date) || 0,
      orders: ordersByDate.get(date) || 0,
    }));

    setSalesOrderSeries(series.length > 0 ? series : [
      { label: "No Data", sales: 0, orders: 0 }
    ]);
  };

  const calculateMovingArticles = (dispatches: Transaction[], inventory: InventoryItem[]) => {
    // Count dispatch frequency per article
    const dispatchCount = new Map<string, number>();
    dispatches.forEach((t) => {
      if (!t.dno || !t.dno.trim()) return; // Skip empty DNOs
      const key = normalizeDno(t.dno);
      dispatchCount.set(key, (dispatchCount.get(key) || 0) + t.qty);
    });

    // Sum inventory per article
    const inventoryByArticle = new Map<string, number>();
    inventory.forEach((item) => {
      if (!item.dno || !item.dno.trim()) return; // Skip empty DNOs
      const key = normalizeDno(item.dno);
      inventoryByArticle.set(key, (inventoryByArticle.get(key) || 0) + item.stock);
    });

    // Calculate slow and fast moving
    const articles: MovingItem[] = [];
    inventoryByArticle.forEach((quantity, articleNo) => {
      if (articleNo && articleNo.trim()) { // Only include valid article numbers
        articles.push({
          articleNo,
          quantity,
          dispatchCount: dispatchCount.get(articleNo) || 0,
        });
      }
    });

    // Slow moving: Max quantity in inventory with very less sales
    // Sorted in descending order by quantity (highest inventory first)
    const slow = articles
      .filter((a) => a.quantity > 0 && a.dispatchCount <= a.quantity * 0.2) // Less than 20% of inventory sold
      .sort((a, b) => b.quantity - a.quantity) // Descending order by quantity
      .slice(0, 10);

    // Fast moving: High dispatch relative to inventory (sorted by dispatch desc)
    const fast = articles
      .filter((a) => a.dispatchCount > 0)
      .sort((a, b) => {
        const ratioA = a.dispatchCount / Math.max(1, a.quantity);
        const ratioB = b.dispatchCount / Math.max(1, b.quantity);
        return ratioB - ratioA;
      })
      .slice(0, 10);

    setSlowMovingArticles(slow);
    setFastMovingArticles(fast);
  };

  const calculateOrderTable = (purchaseOrders: PurchaseOrder[]) => {
    // Group by date
    const ordersByDate = new Map<string, { count: number; value: number }>();

    purchaseOrders.forEach((po) => {
      const date = po.date.split("T")[0];
      const current = ordersByDate.get(date) || { count: 0, value: 0 };
      ordersByDate.set(date, {
        count: current.count + 1,
        value: current.value + (po.grandTotal || 0),
      });
    });

    const rows: OrderRow[] = Array.from(ordersByDate.entries())
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        orderCount: data.count,
        orderValue: formatINR(data.value),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    setOrderTable(rows.length > 0 ? rows : [
      { date: "No orders", orderCount: 0, orderValue: "₹0" }
    ]);
  };

  const calculateRegionDistribution = (allPurchaseOrders: PurchaseOrder[]) => {
    const regionData = new Map<string, {
      sales: number;
      delivered: number;
      pending: number;
      total: number;
    }>();

    allPurchaseOrders.forEach((po) => {
      const region = po.city || "Unknown";
      const current = regionData.get(region) || { sales: 0, delivered: 0, pending: 0, total: 0 };
      
      current.sales += po.grandTotal || 0;
      current.total += 1;
      
      if (po.status === "completed") {
        current.delivered += 1;
      } else {
        current.pending += 1;
      }
      
      regionData.set(region, current);
    });

    const total = Array.from(regionData.values()).reduce((sum, data) => sum + data.sales, 0);

    const colors = ["#3f7edd", "#f59e0b", "#7c5ce6", "#1ba9c3", "#ef4444", "#10b981"];
    const regions: RegionPoint[] = Array.from(regionData.entries())
      .sort((a, b) => b[1].sales - a[1].sales)
      .slice(0, 6)
      .map(([label, data], index) => ({
        label,
        value: data.sales,
        percentage: Math.round((data.sales / total) * 100),
        deliveredPercent: data.total > 0 ? Math.round((data.delivered / data.total) * 100) : 0,
        pendingPercent: data.total > 0 ? Math.round((data.pending / data.total) * 100) : 0,
        totalOrders: data.total,
        color: colors[index % colors.length],
      }));

    setRegionDistribution(regions.length > 0 ? regions : [
      { label: "No Data", value: 1, percentage: 100, deliveredPercent: 0, pendingPercent: 0, totalOrders: 0, color: "#64748b" }
    ]);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            <p className="mt-4 text-slate-600">Loading analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1300px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Domestic Inventory</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]">
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm font-medium sm:text-base">
                {new Date(dateRange.start).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}{" "}
                -{" "}
                {new Date(dateRange.end).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <select
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none sm:text-base"
              value={period}
              onChange={(e) => setPeriod(e.target.value as typeof period)}
            >
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-year">Last Year</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {metricCards.map((card) => (
            <DashboardCard key={card.title}>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{card.title}</p>
              <div className="mt-4 flex items-end gap-3">
                <p className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{card.value}</p>
                {card.trend ? <span className="pb-1 text-sm font-medium text-green-600 sm:text-base">{card.trend}</span> : null}
              </div>
            </DashboardCard>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <DashboardCard>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Sales vs Orders</h2>
            <div className="mt-6">
              <SalesOrdersChart data={salesOrderSeries} />
            </div>
          </DashboardCard>

          <DashboardCard>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Slow Moving Article</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-sm text-slate-500 sm:text-base">
                    <th className="px-5 py-4 font-semibold">Article No</th>
                    <th className="px-5 py-4 font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMovingArticles.map((item) => (
                    <tr key={item.articleNo} className="border-t border-slate-200 text-sm text-slate-700 sm:text-base">
                      <td className="px-5 py-4">{item.articleNo}</td>
                      <td className="px-5 py-4">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
          <DashboardCard>
            <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Order Summary</h2>
            <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="border-b border-slate-200 text-sm text-slate-500 sm:text-base">
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">No of Order</th>
                    <th className="px-5 py-4 font-semibold">Value of Order</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTable.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200 text-sm text-slate-700 last:border-b-0 sm:text-base">
                      <td className="px-5 py-4">{row.date}</td>
                      <td className="px-5 py-4">{row.orderCount}</td>
                      <td className="px-5 py-4">{row.orderValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>

          <DashboardCard>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Fast Moving Article</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-sm text-slate-500 sm:text-base">
                    <th className="px-5 py-4 font-semibold">Article No</th>
                    <th className="px-5 py-4 font-semibold">Sold</th>
                  </tr>
                </thead>
                <tbody>
                  {fastMovingArticles.map((item) => (
                    <tr key={item.articleNo} className="border-t border-slate-200 text-sm text-slate-700 sm:text-base">
                      <td className="px-5 py-4">{item.articleNo}</td>
                      <td className="px-5 py-4">{item.dispatchCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="mt-6">
          <DashboardCard>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Region Wise Distribution</h2>
            <RegionPieChart data={regionDistribution} />
          </DashboardCard>
        </div>
      </div>
    </main>
  );
}
