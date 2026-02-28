"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { ShoppingCart, Globe, House, Boxes } from "lucide-react";

type PeriodKey = "month" | "quarter" | "year";

type DailyReport = {
  date: string;
  totalSale: number;
  expense: number;
  cashSale: number;
  upi: number;
  creditCard: number;
};

type OnlineReport = {
  date: string;
  totalSale: number;
  amountReceived: number;
  totalReturns: number;
  totalQuantity: number;
  myntraAmountReceived: number;
  ajioAmountReceived: number;
  amazonAmountReceived: number;
  flipkartAmountReceived: number;
  snapdealAmountReceived: number;
  websiteAmountReceived: number;
  myntraQty: number;
  ajioQty: number;
  amazonQty: number;
  flipkartQty: number;
  snapdealQty: number;
  websiteQty: number;
  myntraPrice: number;
  ajioPrice: number;
  amazonPrice: number;
  flipkartPrice: number;
  snapdealPrice: number;
  websitePrice: number;
};

type PurchaseOrder = {
  date: string;
  city: string;
  grandTotal: number;
};

type StockReturned = {
  items?: Array<{ qty: number; mrp: number }>;
  totalQuantity?: number;
  mrp?: number;
};

type DistributionItem = {
  category: string;
  value: number;
  percentage: number;
  color: string;
};

type TopProduct = {
  dno: string;
  totalQty: number;
  totalValue: number;
};

type ChartPoint = { label: string; value: number };

type DashboardData = {
  shop: {
    totalSales: number;
    netRevenue: number;
    avgDailySales: number;
    cashSales: number;
    upiPayments: number;
    creditCard: number;
    salesChange: number;
    paymentSplit: ChartPoint[];
    dailyTrend: ChartPoint[];
  };
  ecommerce: {
    totalSales: number;
    netRevenue: number;
    totalOrders: number;
    returnRate: number;
    averageOrderValue: number;
    returnValue: number;
    salesChange: number;
    platformSplit: ChartPoint[];
    platformTable: Array<{ platform: string; sales: number; orders: number; returns: number }>;
    topProducts: TopProduct[];
  };
  domestic: {
    totalSales: number;
    netRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    salesChange: number;
    regionalPerformance: ChartPoint[];
    regionalBreakdown: ChartPoint[];
    monthlyProgress: ChartPoint[];
    categoryDistribution: DistributionItem[];
  };
};

const PERIOD_DAYS: Record<PeriodKey, number> = {
  month: 30,
  quarter: 90,
  year: 365,
};

const defaultData: DashboardData = {
  shop: {
    totalSales: 0,
    netRevenue: 0,
    avgDailySales: 0,
    cashSales: 0,
    upiPayments: 0,
    creditCard: 0,
    salesChange: 0,
    paymentSplit: [],
    dailyTrend: [],
  },
  ecommerce: {
    totalSales: 0,
    netRevenue: 0,
    totalOrders: 0,
    returnRate: 0,
    averageOrderValue: 0,
    returnValue: 0,
    salesChange: 0,
    platformSplit: [],
    platformTable: [],
    topProducts: [],
  },
  domestic: {
    totalSales: 0,
    netRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    salesChange: 0,
    regionalPerformance: [],
    regionalBreakdown: [],
    monthlyProgress: [],
    categoryDistribution: [],
  },
};

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDateRanges(period: PeriodKey) {
  const days = PERIOD_DAYS[period];
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);

  const prevEnd = new Date(start);
  prevEnd.setDate(start.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevEnd.getDate() - days + 1);

  return {
    days,
    current: { startDate: formatDate(start), endDate: formatDate(end) },
    previous: { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) },
  };
}

function sum(values: number[]) {
  return values.reduce((acc, n) => acc + n, 0);
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function Card({ title, value, subtitle, trend }: { title: string; value: string; subtitle?: string; trend?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-slate-600 text-sm">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">{value}</p>
      {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      {trend ? <p className="mt-2 text-sm text-emerald-600">↗ {trend}</p> : null}
    </div>
  );
}

function BarChart({ data, color = "#f59e0b", maxHeight = 160 }: { data: ChartPoint[]; color?: string; maxHeight?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-3 h-44 relative">
        {data.map((d, idx) => (
          <div
            key={d.label}
            className="flex-1 flex flex-col items-center gap-2 relative group cursor-pointer"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {hoveredIndex === idx && (
              <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                {formatINR(d.value)}
              </div>
            )}
            <div
              className="w-full rounded-t-md transition-opacity"
              style={{ height: `${(d.value / max) * maxHeight}px`, backgroundColor: color, opacity: hoveredIndex === idx ? 0.8 : 1 }}
              title={`${d.label}: ${Math.round(d.value).toLocaleString()}`}
            />
            <span className="text-xs text-slate-600">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }: { data: ChartPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 420;
  const height = 220;
  const padLeft = 50;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 40;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;
  const max = Math.max(1, ...data.map((d) => d.value));

  const points = data
    .map((d, i) => {
      const x = padLeft + (i * chartWidth) / Math.max(1, data.length - 1);
      const y = padTop + chartHeight - (d.value / max) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  // Generate y-axis scale labels
  const yAxisSteps = 4;
  const stepValue = Math.ceil(max / yAxisSteps);
  const yAxisLabels = Array.from({ length: yAxisSteps + 1 }, (_, i) => stepValue * i);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">Daily Sales Trend</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 w-full h-80">
        {/* Grid lines */}
        {yAxisLabels.map((val, i) => {
          const y = padTop + chartHeight - (val / max) * chartHeight;
          return (
            <line key={`grid-${i}`} x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4" />
          );
        })}

        {/* Y-axis */}
        <line x1={padLeft} y1={padTop} x2={padLeft} y2={padTop + chartHeight} stroke="#94a3b8" strokeWidth="2" />

        {/* X-axis */}
        <line x1={padLeft} y1={padTop + chartHeight} x2={width - padRight} y2={padTop + chartHeight} stroke="#94a3b8" strokeWidth="2" />

        {/* Y-axis labels */}
        {yAxisLabels.map((val, i) => {
          const y = padTop + chartHeight - (val / max) * chartHeight;
          return (
            <text key={`y-label-${i}`} x={padLeft - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize="11">
              {formatINR(val)}
            </text>
          );
        })}

        {/* X-axis labels - show every 2nd or 3rd label to avoid crowding */}
        {data.map((d, i) => {
          const showLabel = data.length <= 5 || i % 2 === 0 || i === data.length - 1;
          if (!showLabel) return null;
          const x = padLeft + (i * chartWidth) / Math.max(1, data.length - 1);
          return (
            <text key={`x-label-${i}`} x={x} y={padTop + chartHeight + 20} textAnchor="middle" fill="#64748b" fontSize="11">
              {d.label}
            </text>
          );
        })}

        {/* Line and data points */}
        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={points} />
        {data.map((d, i) => {
          const x = padLeft + (i * chartWidth) / Math.max(1, data.length - 1);
          const y = padTop + chartHeight - (d.value / max) * chartHeight;
          return (
            <g key={d.label + i}>
              <circle
                cx={x}
                cy={y}
                r={hoveredIndex === i ? "5" : "3.5"}
                fill={hoveredIndex === i ? "#1d4ed8" : "#2563eb"}
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {hoveredIndex === i && (
                <text x={x} y={y - 15} textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="600" className="pointer-events-none">
                  {formatINR(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PieChartCard({ title, data }: { title: string; data: Array<{ label: string; value: number; color: string }> }) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const total = Math.max(1, sum(data.map((d) => d.value)));
  const gradient = useMemo(() => {
    const segments = data.reduce<Array<{ color: string; start: number; end: number }>>((acc, item) => {
      const start = acc.length === 0 ? 0 : acc[acc.length - 1].end;
      const end = start + (item.value / total) * 100;
      acc.push({ color: item.color, start, end });
      return acc;
    }, []);

    return `conic-gradient(${segments.map((segment) => `${segment.color} ${segment.start}% ${segment.end}%`).join(",")})`;
  }, [data, total]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 flex gap-6 items-center">
        <div className="h-44 w-44 rounded-full" style={{ background: gradient }} />
        <div className="space-y-2 text-sm">
          {data.map((d) => (
            <div
              key={d.label}
              className="flex items-center gap-2 text-slate-700 cursor-pointer hover:text-slate-900 transition-colors"
              onMouseEnter={() => setHoveredLabel(d.label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
              <span>{d.label}: {Math.round((d.value / total) * 100)}%</span>
              {hoveredLabel === d.label && <span className="text-slate-500 ml-auto text-xs">{formatINR(d.value)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<{ shop: PeriodKey; ecommerce: PeriodKey; domestic: PeriodKey }>({
    shop: "month",
    ecommerce: "month",
    domestic: "month",
  });
  const [dashboard, setDashboard] = useState<DashboardData>(defaultData);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const shopRange = getDateRanges(periods.shop);
        const ecommerceRange = getDateRanges(periods.ecommerce);
        const domesticRange = getDateRanges(periods.domestic);

        const [
          shopCurrentRes,
          shopPrevRes,
          ecommerceCurrentRes,
          ecommercePrevRes,
          domesticCurrentRes,
          domesticPrevRes,
          domesticReturnsRes,
          distributionRes,
          topProductsRes,
        ] = await Promise.all([
          api.get("/daily-report/range", { params: shopRange.current }),
          api.get("/daily-report/range", { params: shopRange.previous }),
          api.get("/online-daily-report/range", { params: ecommerceRange.current }),
          api.get("/online-daily-report/range", { params: ecommerceRange.previous }),
          api.get("/purchase-order", { params: domesticRange.current }),
          api.get("/purchase-order", { params: domesticRange.previous }),
          api.get("/stock-returned", { params: domesticRange.current }),
          api.get("/analytics/distribution", { params: { days: domesticRange.days } }),
          api.get("/analytics/top-products", { params: { days: ecommerceRange.days, limit: 5 } }),
        ]);

        const shopCurrent: DailyReport[] = shopCurrentRes.data?.data || [];
        const shopPrev: DailyReport[] = shopPrevRes.data?.data || [];
        const ecommerceCurrent: OnlineReport[] = ecommerceCurrentRes.data?.data || [];
        const ecommercePrev: OnlineReport[] = ecommercePrevRes.data?.data || [];
        const domesticCurrent: PurchaseOrder[] = domesticCurrentRes.data?.data || [];
        const domesticPrev: PurchaseOrder[] = domesticPrevRes.data?.data || [];
        const domesticReturns: StockReturned[] = domesticReturnsRes.data || [];
        const distribution: DistributionItem[] = distributionRes.data?.data || [];
        const topProducts: TopProduct[] = topProductsRes.data?.data || [];

        const shopSalesCurrent = sum(shopCurrent.map((r) => r.totalSale || 0));
        const shopSalesPrev = sum(shopPrev.map((r) => r.totalSale || 0));
        const shopExpense = sum(shopCurrent.map((r) => r.expense || 0));
        const shopCash = sum(shopCurrent.map((r) => r.cashSale || 0));
        const shopUpi = sum(shopCurrent.map((r) => r.upi || 0));
        const shopCard = sum(shopCurrent.map((r) => r.creditCard || 0));
        const shopDailyTrend = [...shopCurrent]
          .sort((a, b) => +new Date(a.date) - +new Date(b.date))
          .slice(-10)
          .map((r) => ({
            label: new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit" }),
            value: r.totalSale || 0,
          }));

        const platformDefs = [
          { key: "myntra", label: "MYNTRA", color: "#2563eb" },
          { key: "amazon", label: "AMAZON", color: "#10b981" },
          { key: "flipkart", label: "FLIPKART", color: "#f59e0b" },
          { key: "ajio", label: "AJIO", color: "#ef4444" },
          { key: "snapdeal", label: "Snapdeal", color: "#8b5cf6" },
          { key: "website", label: "Website", color: "#06b6d4" },
        ] as const;

        const getPlatformSales = (report: OnlineReport, platform: (typeof platformDefs)[number]["key"]) => {
          switch (platform) {
            case "myntra":
              return report.myntraAmountReceived || 0;
            case "amazon":
              return report.amazonAmountReceived || 0;
            case "flipkart":
              return report.flipkartAmountReceived || 0;
            case "ajio":
              return report.ajioAmountReceived || 0;
            case "snapdeal":
              return report.snapdealAmountReceived || 0;
            case "website":
              return report.websiteAmountReceived || 0;
          }
        };

        const getPlatformOrders = (report: OnlineReport, platform: (typeof platformDefs)[number]["key"]) => {
          switch (platform) {
            case "myntra":
              return report.myntraQty || 0;
            case "amazon":
              return report.amazonQty || 0;
            case "flipkart":
              return report.flipkartQty || 0;
            case "ajio":
              return report.ajioQty || 0;
            case "snapdeal":
              return report.snapdealQty || 0;
            case "website":
              return report.websiteQty || 0;
          }
        };

        const getPlatformReturns = (report: OnlineReport, platform: (typeof platformDefs)[number]["key"]) => {
          switch (platform) {
            case "myntra":
              return report.myntraPrice || 0;
            case "amazon":
              return report.amazonPrice || 0;
            case "flipkart":
              return report.flipkartPrice || 0;
            case "ajio":
              return report.ajioPrice || 0;
            case "snapdeal":
              return report.snapdealPrice || 0;
            case "website":
              return report.websitePrice || 0;
          }
        };

        const platformTable = platformDefs.map((p) => ({
          platform: p.label,
          sales: sum(ecommerceCurrent.map((r) => getPlatformSales(r, p.key))),
          orders: sum(ecommerceCurrent.map((r) => getPlatformOrders(r, p.key))),
          returns: sum(ecommerceCurrent.map((r) => getPlatformReturns(r, p.key))),
        }));

        const ecommerceSalesCurrent = sum(ecommerceCurrent.map((r) => r.totalSale || 0));
        const ecommerceSalesPrev = sum(ecommercePrev.map((r) => r.totalSale || 0));
        const ecommerceNet = sum(ecommerceCurrent.map((r) => r.amountReceived || 0));
        const ecommerceReturns = sum(ecommerceCurrent.map((r) => r.totalReturns || 0));
        const ecommerceOrders = sum(ecommerceCurrent.map((r) => r.totalQuantity || 0));

        const domesticSalesCurrent = sum(domesticCurrent.map((o) => o.grandTotal || 0));
        const domesticSalesPrev = sum(domesticPrev.map((o) => o.grandTotal || 0));
        const domesticReturnsValue = sum(
          domesticReturns.map((ret) => {
            if (ret.items?.length) {
              return sum(ret.items.map((it) => (it.qty || 0) * (it.mrp || 0)));
            }
            return (ret.totalQuantity || 0) * (ret.mrp || 0);
          })
        );

        const cityTotals = domesticCurrent.reduce<Record<string, number>>((acc, order) => {
          const city = order.city || "Unknown";
          acc[city] = (acc[city] || 0) + (order.grandTotal || 0);
          return acc;
        }, {});

        const regionalSorted = Object.entries(cityTotals)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 4);

        const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
        const monthlyProgress = weeks.map((label, index) => {
          const bucketStart = (domesticRange.days / 4) * index;
          const bucketEnd = (domesticRange.days / 4) * (index + 1);
          const value = sum(
            domesticCurrent
              .filter((o) => {
                const daysAgo = (Date.now() - +new Date(o.date)) / (1000 * 60 * 60 * 24);
                return daysAgo >= bucketStart && daysAgo < bucketEnd;
              })
              .map((o) => o.grandTotal || 0)
          );
          return { label, value };
        });

        setDashboard({
          shop: {
            totalSales: shopSalesCurrent,
            netRevenue: shopSalesCurrent - shopExpense,
            avgDailySales: shopCurrent.length ? shopSalesCurrent / shopCurrent.length : 0,
            cashSales: shopCash,
            upiPayments: shopUpi,
            creditCard: shopCard,
            salesChange: pctChange(shopSalesCurrent, shopSalesPrev),
            paymentSplit: [
              { label: "Cash", value: shopCash },
              { label: "UPI", value: shopUpi },
              { label: "Credit", value: shopCard },
            ],
            dailyTrend: shopDailyTrend,
          },
          ecommerce: {
            totalSales: ecommerceSalesCurrent,
            netRevenue: ecommerceNet,
            totalOrders: ecommerceOrders,
            returnRate: ecommerceSalesCurrent > 0 ? (ecommerceReturns / ecommerceSalesCurrent) * 100 : 0,
            averageOrderValue: ecommerceOrders > 0 ? ecommerceNet / ecommerceOrders : 0,
            returnValue: ecommerceReturns,
            salesChange: pctChange(ecommerceSalesCurrent, ecommerceSalesPrev),
            platformSplit: platformTable.map((row) => ({ label: row.platform, value: row.sales })),
            platformTable,
            topProducts,
          },
          domestic: {
            totalSales: domesticSalesCurrent,
            netRevenue: domesticSalesCurrent - domesticReturnsValue,
            totalOrders: domesticCurrent.length,
            avgOrderValue: domesticCurrent.length ? domesticSalesCurrent / domesticCurrent.length : 0,
            salesChange: pctChange(domesticSalesCurrent, domesticSalesPrev),
            regionalPerformance: regionalSorted,
            regionalBreakdown: regionalSorted,
            monthlyProgress,
            categoryDistribution: distribution,
          },
        });
      } catch (error) {
        console.error("Analytics dashboard fetch error:", error);
        setDashboard(defaultData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [periods]);

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-5">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900">Performance Dashboard</h1>
          <a
            href="/domestic-inventory"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-lg font-medium text-white hover:bg-blue-700"
          >
            <Boxes className="h-5 w-5" /> View Inventory
          </a>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-4xl font-semibold text-slate-900">
                <ShoppingCart className="h-6 w-6 text-blue-600" /> Shop
              </div>
              <select
                value={periods.shop}
                onChange={(e) => setPeriods((prev) => ({ ...prev, shop: e.target.value as PeriodKey }))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-black font-medium"
              >
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <Card title="Total Sales" value={formatINR(dashboard.shop.totalSales)} subtitle="Current period" trend={`${dashboard.shop.salesChange.toFixed(1)}% from last period`} />
            <Card title="Net Revenue" value={formatINR(dashboard.shop.netRevenue)} subtitle={`After expenses: ${formatINR(Math.max(0, dashboard.shop.totalSales - dashboard.shop.netRevenue))}`} />
            <Card title="Average Daily Sales" value={formatINR(dashboard.shop.avgDailySales)} subtitle={`Active days: ${dashboard.shop.dailyTrend.length}`} />
            <Card title="Cash Sales" value={formatINR(dashboard.shop.cashSales)} subtitle={`${dashboard.shop.totalSales > 0 ? ((dashboard.shop.cashSales / dashboard.shop.totalSales) * 100).toFixed(1) : "0.0"}% of total`} />
            <Card title="UPI Payments" value={formatINR(dashboard.shop.upiPayments)} subtitle={`${dashboard.shop.totalSales > 0 ? ((dashboard.shop.upiPayments / dashboard.shop.totalSales) * 100).toFixed(1) : "0.0"}% of total`} />
            <Card title="Credit Card" value={formatINR(dashboard.shop.creditCard)} subtitle={`${dashboard.shop.totalSales > 0 ? ((dashboard.shop.creditCard / dashboard.shop.totalSales) * 100).toFixed(1) : "0.0"}% of total`} />
            <PieChartCard
              title="Payment Methods Distribution"
              data={[
                { label: "Cash", value: dashboard.shop.cashSales, color: "#3b82f6" },
                { label: "UPI", value: dashboard.shop.upiPayments, color: "#10b981" },
                { label: "Credit", value: dashboard.shop.creditCard, color: "#f59e0b" },
              ]}
            />
            <LineChart data={dashboard.shop.dailyTrend} />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-4xl font-semibold text-slate-900">
                <Globe className="h-6 w-6 text-emerald-600" /> E-commerce
              </div>
              <select
                value={periods.ecommerce}
                onChange={(e) => setPeriods((prev) => ({ ...prev, ecommerce: e.target.value as PeriodKey }))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-black font-medium"
              >
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <Card title="Total Sales" value={formatINR(dashboard.ecommerce.totalSales)} subtitle="Current period" trend={`${dashboard.ecommerce.salesChange.toFixed(1)}% from last period`} />
            <Card title="Net Revenue" value={formatINR(dashboard.ecommerce.netRevenue)} subtitle={`After returns: ${formatINR(dashboard.ecommerce.returnValue)}`} />
            <Card title="Total Orders" value={dashboard.ecommerce.totalOrders.toLocaleString()} subtitle={`Avg. order value: ${formatINR(dashboard.ecommerce.averageOrderValue)}`} />
            <Card title="Return Rate" value={`${dashboard.ecommerce.returnRate.toFixed(1)}%`} subtitle={`Total returns: ${formatINR(dashboard.ecommerce.returnValue)}`} />
            <Card title="Return Value" value={formatINR(dashboard.ecommerce.returnValue)} subtitle="Calculated from platform return totals" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Top Products</h3>
              <div className="mt-3">
                <BarChart
                  data={dashboard.ecommerce.topProducts.map((p) => ({ label: p.dno || "Unknown", value: p.totalQty || 0 }))}
                  color="#10b981"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Platform Split</h3>
              <div className="mt-3">
                <BarChart data={dashboard.ecommerce.platformSplit} color="#3b82f6" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Platform Details</h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="pb-2">Platform</th>
                      <th className="pb-2">Sales</th>
                      <th className="pb-2">Orders</th>
                      <th className="pb-2">Returns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.ecommerce.platformTable.map((row) => (
                      <tr key={row.platform} className="border-b border-slate-100">
                        <td className="py-2 font-medium text-slate-800">{row.platform}</td>
                        <td className="py-2 text-slate-700">{formatINR(row.sales)}</td>
                        <td className="py-2 text-slate-700">{row.orders.toLocaleString()}</td>
                        <td className="py-2 text-red-600">{Math.round(row.returns).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-4xl font-semibold text-slate-900">
                <House className="h-6 w-6 text-orange-600" /> Domestic Sales
              </div>
              <select
                value={periods.domestic}
                onChange={(e) => setPeriods((prev) => ({ ...prev, domestic: e.target.value as PeriodKey }))}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-black font-medium"
              >
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
            <Card title="Total Sales" value={formatINR(dashboard.domestic.totalSales)} subtitle="Current period" trend={`${dashboard.domestic.salesChange.toFixed(1)}% from last period`} />
            <Card title="Net Revenue" value={formatINR(dashboard.domestic.netRevenue)} subtitle={`After stock returns`} />
            <Card title="Total Orders" value={dashboard.domestic.totalOrders.toLocaleString()} subtitle={`Avg. order value: ${formatINR(dashboard.domestic.avgOrderValue)}`} />
            <Card title="Average Order Value" value={formatINR(dashboard.domestic.avgOrderValue)} subtitle="Based on current domestic POs" />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Regional Performance</h3>
              <div className="mt-3">
                <BarChart data={dashboard.domestic.regionalPerformance} color="#f59e0b" />
              </div>
            </div>
            <PieChartCard
              title="Sales by Category"
              data={dashboard.domestic.categoryDistribution.map((d) => ({
                label: d.category,
                value: d.value,
                color: d.color,
              }))}
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Monthly Progress</h3>
              <div className="mt-3">
                <LineChart data={dashboard.domestic.monthlyProgress} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">Regional Breakdown</h3>
              <div className="mt-4 space-y-4">
                {dashboard.domestic.regionalBreakdown.map((region) => {
                  const max = Math.max(1, ...dashboard.domestic.regionalBreakdown.map((r) => r.value));
                  const width = (region.value / max) * 100;
                  return (
                    <div key={region.label}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-700">{region.label}</span>
                        <span className="font-medium text-slate-800">{formatINR(region.value)}</span>
                      </div>
                      <div className="mt-2 h-3 w-full rounded bg-slate-200">
                        <div className="h-3 rounded bg-orange-500" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {loading && (
          <div className="fixed bottom-5 right-5 rounded-xl bg-slate-900 px-4 py-2 text-white shadow-lg">
            Loading analytics...
          </div>
        )}
      </div>
    </div>
  );
}
