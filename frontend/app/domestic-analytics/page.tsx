"use client";

import { CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

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

type SlowMovingItem = {
  articleNo: string;
  quantity: number;
};

type OrderRow = {
  date: string;
  orderCount: number;
  orderValue: string;
};

type RegionPoint = {
  label: string;
  value: number;
  color: string;
};

const metricCards: MetricCard[] = [
  {
    title: "Total Sale",
    value: "₹32,45,890",
    trend: "+8.3%",
  },
  {
    title: "Avg Article Sale",
    value: "₹18,670",
    trend: "+4.1%",
  },
  {
    title: "Current Inventory Value",
    value: "₹87,65,432",
  },
];

const salesOrderSeries: SeriesPoint[] = [
  { label: "1 Feb", sales: 3000, orders: 3200 },
  { label: "5 Feb", sales: 2700, orders: 2800 },
  { label: "10 Feb", sales: 3950, orders: 4100 },
  { label: "15 Feb", sales: 3400, orders: 3600 },
  { label: "20 Feb", sales: 4300, orders: 4500 },
  { label: "25 Feb", sales: 3800, orders: 3900 },
  { label: "28 Feb", sales: 4600, orders: 4800 },
];

const slowMovingArticles: SlowMovingItem[] = [
  { articleNo: "D-1024", quantity: 178 },
  { articleNo: "D-2031", quantity: 156 },
  { articleNo: "D-3045", quantity: 134 },
  { articleNo: "D-4012", quantity: 123 },
  { articleNo: "D-5089", quantity: 112 },
];

const orderTable: OrderRow[] = [
  { date: "2 Feb 2026", orderCount: 34, orderValue: "₹89,450" },
  { date: "5 Feb 2026", orderCount: 42, orderValue: "₹1,12,340" },
  { date: "8 Feb 2026", orderCount: 28, orderValue: "₹67,890" },
  { date: "12 Feb 2026", orderCount: 51, orderValue: "₹1,34,560" },
  { date: "15 Feb 2026", orderCount: 39, orderValue: "₹98,230" },
  { date: "18 Feb 2026", orderCount: 45, orderValue: "₹1,15,670" },
];

const regionDistribution: RegionPoint[] = [
  { label: "North", value: 30, color: "#3f7edd" },
  { label: "West", value: 25, color: "#f59e0b" },
  { label: "East", value: 20, color: "#7c5ce6" },
  { label: "South", value: 25, color: "#1ba9c3" },
];

function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}

function SalesOrdersChart({ data }: { data: SeriesPoint[] }) {
  const width = 900;
  const height = 360;
  const leftPad = 80;
  const rightPad = 32;
  const topPad = 26;
  const bottomPad = 64;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxY = 6000;
  const steps = [0, 1500, 3000, 4500, 6000];

  const toX = (index: number) => leftPad + (index * chartWidth) / Math.max(1, data.length - 1);
  const toY = (value: number) => topPad + chartHeight - (value / maxY) * chartHeight;

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
                {tick}
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

        {data.map((point, index) => (
          <g key={`dot-${point.label}`}>
            <circle cx={toX(index)} cy={toY(point.sales)} r="4" fill="#ffffff" stroke="#3b82f6" strokeWidth="3" />
            <circle cx={toX(index)} cy={toY(point.orders)} r="4" fill="#ffffff" stroke="#06b6d4" strokeWidth="3" />
          </g>
        ))}
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
          <path key={slice.label} d={slice.path} fill={slice.color} stroke="#ffffff" strokeWidth="2" />
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
            {slice.label} {slice.value}%
          </div>
        );
      })}
    </div>
  );
}

export default function DomesticAnalyticsPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1300px]">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-5xl">Domestic Inventory</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600 shadow-sm">
              <CalendarDays className="h-5 w-5" />
              <span className="text-sm font-medium sm:text-xl">1 Feb 2026 - 28 Feb 2026</span>
            </div>
            <select
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm outline-none sm:text-xl"
              defaultValue="last-month"
            >
              <option value="last-month">Last Month</option>
              <option value="this-month">This Month</option>
              <option value="this-quarter">This Quarter</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {metricCards.map((card) => (
            <DashboardCard key={card.title}>
              <p className="text-lg font-semibold text-slate-500">{card.title}</p>
              <div className="mt-4 flex items-end gap-3">
                <p className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{card.value}</p>
                {card.trend ? <span className="pb-1 text-lg font-medium text-green-600 sm:text-2xl">{card.trend}</span> : null}
              </div>
            </DashboardCard>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <DashboardCard>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-4xl">Sales vs Orders</h2>
            <div className="mt-6">
              <SalesOrdersChart data={salesOrderSeries} />
            </div>
          </DashboardCard>

          <DashboardCard>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-4xl">Slow Moving Article</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr className="text-base text-slate-500 sm:text-lg">
                    <th className="px-5 py-4 font-semibold">Article No</th>
                    <th className="px-5 py-4 font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {slowMovingArticles.map((item) => (
                    <tr key={item.articleNo} className="border-t border-slate-200 text-base text-slate-700 sm:text-xl">
                      <td className="px-5 py-4">{item.articleNo}</td>
                      <td className="px-5 py-4">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DashboardCard>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-base text-slate-500 sm:text-xl">
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">No of Order</th>
                    <th className="px-5 py-4 font-semibold">Value of Order</th>
                  </tr>
                </thead>
                <tbody>
                  {orderTable.map((row) => (
                    <tr key={row.date} className="border-b border-slate-200 text-base text-slate-700 last:border-b-0 sm:text-xl">
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
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-4xl">Region Wise Distribution</h2>
            <RegionPieChart data={regionDistribution} />
          </DashboardCard>
        </div>
      </div>
    </main>
  );
}
