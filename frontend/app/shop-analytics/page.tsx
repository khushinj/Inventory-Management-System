"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../../lib/api";

type Period = "last-month" | "last-3-months" | "last-6-months" | "last-year" | "custom";

type DailyReport = {
  date: string;
  totalSale?: number;
  expense?: number;
  qty?: number;
  cashSale?: number;
  upi?: number;
  creditCard?: number;
};

type ShopEntry = {
  dno?: string;
  qty?: number;
  date?: string;
  formType?: string;
};

type JobCard = {
  designNumber?: string;
  mrp?: number;
};

type ShopInventoryItem = {
  designNumber: string;
  net?: number;
};

type TrendPoint = {
  dateIso: string;
  label: string;
  sales: number;
  expense: number;
  qty: number;
  orders: number;
};

type DateRange = {
  start: string;
  end: string;
};

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function getDateRangeByPeriod(period: Exclude<Period, "custom">): DateRange {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now);

  if (period === "last-month") {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    end = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (period === "last-3-months") {
    start = new Date(now);
    start.setMonth(now.getMonth() - 3);
  } else if (period === "last-6-months") {
    start = new Date(now);
    start.setMonth(now.getMonth() - 6);
  } else {
    start = new Date(now);
    start.setFullYear(now.getFullYear() - 1);
  }

  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

function pctChange(current: number, previous: number) {
  if (previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
}

function normalizeDno(dno?: string) {
  return (dno || "").trim().replace(/\s+/g, "").toUpperCase();
}

function toIsoDate(value?: string) {
  if (!value) return "";
  return value.split("T")[0] || "";
}

function ensureMinimumRows<T>(rows: T[], minimum: number, fillerFactory: (index: number) => T) {
  if (rows.length >= minimum) return rows;
  const missing = minimum - rows.length;
  const filler = Array.from({ length: missing }, (_, index) => fillerFactory(index));
  return [...rows, ...filler];
}

function pickDatesForChart(dates: string[], maxPoints: number) {
  if (dates.length <= maxPoints) return dates;
  const selected = new Set<number>([0, dates.length - 1]);
  for (let i = 1; i < maxPoints - 1; i += 1) {
    selected.add(Math.round((i * (dates.length - 1)) / (maxPoints - 1)));
  }

  return Array.from(selected)
    .sort((a, b) => a - b)
    .map((index) => dates[index]);
}

function Card({ title, value, trend }: { title: string; value: string; trend?: string }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur">
      <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 sm:text-base">{title}</p>
      <div className="mt-4 flex items-end gap-3">
        <p className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
        {trend ? <span className="pb-1 text-sm font-medium text-emerald-600 sm:text-base">{trend}</span> : null}
      </div>
    </section>
  );
}

function SalesExpenseChart({ points }: { points: TrendPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 900;
  const height = 360;
  const leftPad = 80;
  const rightPad = 26;
  const topPad = 26;
  const bottomPad = 56;
  const chartWidth = width - leftPad - rightPad;
  const chartHeight = height - topPad - bottomPad;
  const maxY = Math.max(100, ...points.flatMap((item) => [item.sales, item.expense]));
  const roundedMax = Math.ceil(maxY / 1000) * 1000;
  const steps = Array.from({ length: 5 }, (_, idx) => (roundedMax / 4) * idx);
  const dotR = points.length > 20 ? 3 : 5;
  const maxLabels = 8;
  const labelStep = Math.max(1, Math.ceil(points.length / maxLabels));

  const toX = (index: number) => leftPad + (index * chartWidth) / Math.max(1, points.length - 1);
  const toY = (value: number) => topPad + chartHeight - (value / roundedMax) * chartHeight;

  const salesPolyline = points.map((item, index) => `${toX(index)},${toY(item.sales)}`).join(" ");
  const expensePolyline = points.map((item, index) => `${toX(index)},${toY(item.expense)}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[340px] w-full min-w-[680px]">
        {steps.map((tick) => {
          const y = toY(tick);
          return (
            <g key={`tick-${tick}`}>
              <line x1={leftPad} y1={y} x2={width - rightPad} y2={y} stroke="#dce3ea" strokeDasharray="5 5" />
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

        {points.map((item, index) => {
          const showLabel = index % labelStep === 0 || index === points.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={`label-${item.label}-${index}`}
              x={toX(index)}
              y={topPad + chartHeight + 25}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="17"
            >
              {item.label}
            </text>
          );
        })}

        <polyline fill="none" stroke="#3b82f6" strokeWidth="4" points={salesPolyline} />
        <polyline fill="none" stroke="#ef4444" strokeWidth="4" points={expensePolyline} />

        {points.map((item, index) => {
          const x = toX(index);
          const ySales = toY(item.sales);
          const yExpense = toY(item.expense);
          const topY = Math.min(ySales, yExpense);
          return (
            <g
              key={`dot-${item.label}-${index}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{ cursor: "pointer" }}
            >
              <line x1={x} y1={topPad} x2={x} y2={topPad + chartHeight} stroke="#cbd5e1" strokeDasharray="4 4" opacity={hoveredIndex === index ? 1 : 0} />
              <circle cx={x} cy={ySales} r={dotR} fill="#fff" stroke="#3b82f6" strokeWidth="3" />
              <circle cx={x} cy={yExpense} r={dotR} fill="#fff" stroke="#ef4444" strokeWidth="3" />
              <rect x={x - 10} y={topPad} width="20" height={chartHeight} fill="transparent" />

              {hoveredIndex === index ? (() => {
                  const bw = 230;
                  const bh = 90;
                  const bx = Math.max(leftPad + 4, Math.min(width - rightPad - bw - 4, x - bw / 2));
                  const by = Math.max(topPad + 4, topY - bh - 10);
                  const cx2 = bx + bw / 2;
                  return (
                    <>
                      <rect x={bx} y={by} width={bw} height={bh} rx="8" fill="#0f172a" opacity="0.96" />
                      <text x={cx2} y={by + 20} textAnchor="middle" fill="#e2e8f0" fontSize="12" fontWeight="600">
                        {item.label}
                      </text>
                      <text x={cx2} y={by + 38} textAnchor="middle" fill="#60a5fa" fontSize="12">
                        Sales: {formatINR(item.sales)}
                      </text>
                      <text x={cx2} y={by + 56} textAnchor="middle" fill="#f87171" fontSize="12">
                        Expenses: {formatINR(item.expense)}
                      </text>
                      <text x={cx2} y={by + 74} textAnchor="middle" fill="#cbd5e1" fontSize="11">
                        Qty: {item.qty} | Orders: {item.orders}
                      </text>
                    </>
                  );
                })() : null}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center gap-6 text-sm sm:text-lg">
        <div className="flex items-center gap-2 text-blue-500">
          <span className="leading-none">•</span>
          <span>sale</span>
        </div>
        <div className="flex items-center gap-2 text-red-500">
          <span className="leading-none">•</span>
          <span>expenses</span>
        </div>
      </div>
    </div>
  );
}

function PaymentPieChart({ values }: { values: { cash: number; upi: number; card: number } }) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const total = values.cash + values.upi + values.card;
  const normalized = total > 0 ? values : { cash: 0, upi: 0, card: 0 };
  const normalizedTotal = normalized.cash + normalized.upi + normalized.card;
  const slices = [
    { key: "cash", label: "Cash", value: normalized.cash, color: "#3f7edd" },
    { key: "upi", label: "UPI", value: normalized.upi, color: "#1ba9c3" },
    { key: "card", label: "Card", value: normalized.card, color: "#7c5ce6" },
  ];

  const size = 360;
  const center = size / 2;
  const radius = 126;

  const paths = (normalizedTotal > 0 ? slices : [{ key: "none", label: "No Data", value: 1, color: "#94a3b8" }])
    .reduce<{ startAngle: number; items: Array<{ path: string; midAngle: number; color: string; label: string; pct: number }> }>(
      (acc, slice) => {
        const angle = (slice.value / Math.max(1, normalizedTotal)) * 360;
        const next = acc.startAngle + angle;
        const x1 = center + radius * Math.cos((Math.PI * acc.startAngle) / 180);
        const y1 = center + radius * Math.sin((Math.PI * acc.startAngle) / 180);
        const x2 = center + radius * Math.cos((Math.PI * next) / 180);
        const y2 = center + radius * Math.sin((Math.PI * next) / 180);
        const large = angle > 180 ? 1 : 0;
        return {
          startAngle: next,
          items: [
            ...acc.items,
            {
              path: `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`,
              midAngle: acc.startAngle + angle / 2,
              color: slice.color,
              label: slice.label,
              pct: Math.round((slice.value / normalizedTotal) * 100),
            },
          ],
        };
      },
      { startAngle: -90, items: [] }
    )
    .items;

  const activeSlice = paths.find((slice) => slice.label === hoveredSlice) ?? null;

  return (
    <div className="relative flex items-center justify-center px-2 pb-16 pt-2 sm:px-4 sm:pb-20">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[320px] w-[320px] overflow-visible sm:h-[340px] sm:w-[340px]">
        {paths.map((slice) => (
          <path
            key={`${slice.label}-${slice.color}`}
            d={slice.path}
            fill={slice.color}
            stroke="#ffffff"
            strokeWidth="2"
            style={{ cursor: "pointer", opacity: hoveredSlice === slice.label ? 0.8 : 1 }}
            onMouseEnter={() => setHoveredSlice(slice.label)}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        ))}

        {paths.map((slice) => {
          const angle = (Math.PI * slice.midAngle) / 180;
          const connectorStartRadius = radius + 6;
          const connectorEndRadius = radius + 24;
          const textRadius = radius + 30;
          const startX = center + connectorStartRadius * Math.cos(angle);
          const startY = center + connectorStartRadius * Math.sin(angle);
          const endX = center + connectorEndRadius * Math.cos(angle);
          const endY = center + connectorEndRadius * Math.sin(angle);
          const labelX = Math.min(size - 28, Math.max(28, center + textRadius * Math.cos(angle)));
          const labelY = Math.min(size - 24, Math.max(24, center + textRadius * Math.sin(angle)));
          const isRightSide = Math.cos(angle) >= 0;

          return (
            <g key={`label-${slice.label}`} className="pointer-events-none">
              <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={slice.color} strokeWidth="1.5" opacity="0.75" />
              <text
                x={labelX}
                y={labelY - 2}
                textAnchor={isRightSide ? "start" : "end"}
                fill="#0f172a"
                fontSize="11"
                fontWeight="600"
              >
                {slice.label}
              </text>
              <text
                x={labelX}
                y={labelY + 12}
                textAnchor={isRightSide ? "start" : "end"}
                fill={slice.color}
                fontSize="10"
                fontWeight="600"
              >
                {slice.pct}%
              </text>
            </g>
          );
        })}
      </svg>

      {activeSlice ? (
        <div className="absolute bottom-1 left-1/2 min-w-[170px] -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-sm sm:text-[13px]">
          <div className="font-semibold text-slate-900">
            {activeSlice.label}: {formatINR(slices.find((slice) => slice.label === activeSlice.label)?.value || 0)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 sm:text-xs">Share: {activeSlice.pct}%</div>
        </div>
      ) : null}
    </div>
  );
}

export default function ShopAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("last-month");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeByPeriod("last-month"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [shopEntries, setShopEntries] = useState<ShopEntry[]>([]);
  const [shopInventory, setShopInventory] = useState<ShopInventoryItem[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  useEffect(() => {
    if (period === "custom") return;
    setDateRange(getDateRangeByPeriod(period));
  }, [period]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [dailyRes, shopRes, inventoryRes, jobCardRes] = await Promise.all([
        api.get("/daily-report"),
        api.get("/shop"),
        api.get("/shop-inventory"),
        api.get("/jobcard"),
      ]);

      setReports(Array.isArray(dailyRes.data?.data) ? dailyRes.data.data : []);
      setShopEntries(Array.isArray(shopRes.data) ? shopRes.data : []);
      setShopInventory(Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : []);
      setJobCards(Array.isArray(jobCardRes.data) ? jobCardRes.data : []);
    } catch (error) {
      console.error("Error loading shop analytics:", error);
      setReports([]);
      setShopEntries([]);
      setShopInventory([]);
      setJobCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((report) => {
        const date = toIsoDate(report.date);
        return date >= dateRange.start && date <= dateRange.end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dateRange.end, dateRange.start, reports]);

  const mrpByDesign = useMemo(() => {
    const map = new Map<string, number>();
    jobCards.forEach((card) => {
      const key = normalizeDno(card.designNumber);
      if (!key) return;
      map.set(key, card.mrp || 0);
    });
    return map;
  }, [jobCards]);

  const inventoryDesignSet = useMemo(() => {
    return new Set(
      shopInventory
        .map((item) => normalizeDno(item.designNumber))
        .filter(Boolean)
    );
  }, [shopInventory]);

  const getUnitAmount = useCallback(
    (designNumber?: string) => {
      const key = normalizeDno(designNumber);
      if (!key || !inventoryDesignSet.has(key)) return 0;
      return mrpByDesign.get(key) || 0;
    },
    [inventoryDesignSet, mrpByDesign]
  );

  const inRangeSalesEntries = useMemo(() => {
    return shopEntries.filter((entry) => {
      if (entry.formType !== "sales") return false;
      const date = toIsoDate(entry.date);
      return date >= dateRange.start && date <= dateRange.end;
    });
  }, [dateRange.end, dateRange.start, shopEntries]);

  const metrics = useMemo(() => {
    const totalSale = filteredReports.reduce((sum, report) => sum + (report.totalSale || 0), 0);
    const totalQtySold = filteredReports.reduce((sum, report) => sum + (report.qty || 0), 0);
    const avgSellingPrice = totalQtySold > 0 ? totalSale / totalQtySold : 0;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const numDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const avgSalePerDay = totalSale / numDays;

    const reportsByDate = [...filteredReports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestDaySale = reportsByDate[0]?.totalSale || 0;
    const previousDaySale = reportsByDate[1]?.totalSale || 0;

    const inventoryValue = shopInventory.reduce((sum, item) => {
      const qty = item.net || 0;
      const mrp = getUnitAmount(item.designNumber);
      return sum + qty * mrp;
    }, 0);

    return {
      totalSale,
      avgSellingPrice,
      avgSalePerDay,
      totalSaleChange: pctChange(latestDaySale, previousDaySale),
      inventoryValue,
    };
  }, [dateRange.end, dateRange.start, getUnitAmount, filteredReports, shopInventory]);

  const trendSeries = useMemo(() => {
    const saleByDate = new Map<string, number>();
    const expenseByDate = new Map<string, number>();
    filteredReports.forEach((report) => {
      const dateIso = toIsoDate(report.date);
      if (!dateIso) return;
      saleByDate.set(dateIso, (saleByDate.get(dateIso) || 0) + (report.totalSale || 0));
      expenseByDate.set(dateIso, (expenseByDate.get(dateIso) || 0) + (report.expense || 0));
    });

    const qtyByDate = new Map<string, { qty: number; orders: number }>();
    inRangeSalesEntries.forEach((entry) => {
      const dateIso = toIsoDate(entry.date);
      if (!dateIso) return;
      const existing = qtyByDate.get(dateIso) || { qty: 0, orders: 0 };
      qtyByDate.set(dateIso, { qty: existing.qty + (entry.qty || 0), orders: existing.orders + 1 });
    });

    // Generate every date in the selected range
    const allDates: string[] = [];
    const cursor = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    while (cursor <= endDate) {
      allDates.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    if (allDates.length === 0) {
      return [{ dateIso: "", label: "No Data", sales: 0, expense: 0, qty: 0, orders: 0 }];
    }

    return allDates.map((dateIso) => {
      const q = qtyByDate.get(dateIso) || { qty: 0, orders: 0 };
      return {
        dateIso,
        label: formatDateLabel(dateIso),
        sales: Math.round(saleByDate.get(dateIso) || 0),
        expense: Math.round(expenseByDate.get(dateIso) || 0),
        qty: q.qty,
        orders: q.orders,
      };
    });
  }, [dateRange.end, dateRange.start, filteredReports, inRangeSalesEntries]);

  const slowMoving = useMemo(() => {
    const stockByDesign = shopInventory.reduce<Record<string, number>>((acc, item) => {
      const key = (item.designNumber || "").trim();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + (item.net || 0);
      return acc;
    }, {});

    const soldByDesign = inRangeSalesEntries.reduce<Record<string, number>>((acc, item) => {
      const key = normalizeDno(item.dno);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + (item.qty || 0);
      return acc;
    }, {});

    return Object.entries(stockByDesign)
      .map(([productNo, quantity]) => ({
        productNo,
        quantity,
        sold: soldByDesign[productNo] || 0,
      }))
      .filter((item) => item.quantity > 0 && item.sold <= item.quantity * 0.25)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [inRangeSalesEntries, shopInventory]);

  const topArticles = useMemo(() => {
    const grouped = inRangeSalesEntries.reduce<Record<string, number>>((acc, item) => {
      const key = normalizeDno(item.dno);
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + (item.qty || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([productNo, quantity]) => ({ productNo, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [inRangeSalesEntries]);

  const tableRows = useMemo(() => {
    const saleByDate = filteredReports.reduce<Record<string, number>>((acc, report) => {
      const dateIso = toIsoDate(report.date);
      if (!dateIso) return acc;
      acc[dateIso] = (acc[dateIso] || 0) + (report.totalSale || 0);
      return acc;
    }, {});

    const qtyByDate = inRangeSalesEntries.reduce<Record<string, number>>((acc, entry) => {
      const dateIso = toIsoDate(entry.date);
      if (!dateIso) return acc;
      acc[dateIso] = (acc[dateIso] || 0) + (entry.qty || 0);
      return acc;
    }, {});

    const allDates = Array.from(new Set([...Object.keys(saleByDate), ...Object.keys(qtyByDate)]));

    return allDates
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((dateIso) => ({
        date: new Date(dateIso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
        totalSaleAmount: saleByDate[dateIso] || 0,
        totalSale: formatINR(saleByDate[dateIso] || 0),
        quantity: qtyByDate[dateIso] || 0,
      }));
  }, [filteredReports, inRangeSalesEntries]);

  const dateTableRows = tableRows;

  const dateTableTotals = useMemo(() => {
    return dateTableRows.reduce(
      (acc, row) => ({
        totalSaleAmount: acc.totalSaleAmount + row.totalSaleAmount,
        quantity: acc.quantity + row.quantity,
      }),
      { totalSaleAmount: 0, quantity: 0 }
    );
  }, [dateTableRows]);

  const slowMovingRows = useMemo(
    () => ensureMinimumRows(slowMoving, 10, () => ({ productNo: "-", quantity: 0, sold: 0 })),
    [slowMoving]
  );

  const topArticlesRows = useMemo(
    () => ensureMinimumRows(topArticles, 10, () => ({ productNo: "-", quantity: 0 })),
    [topArticles]
  );

  const paymentDistribution = useMemo(() => {
    return filteredReports.reduce(
      (acc, item) => ({
        cash: acc.cash + (item.cashSale || 0),
        upi: acc.upi + (item.upi || 0),
        card: acc.card + (item.creditCard || 0),
      }),
      { cash: 0, upi: 0, card: 0 }
    );
  }, [filteredReports]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-slate-800" />
            <p className="mt-4 text-slate-600">Loading shop analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Shop Dashboard</h1>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)]"
              >
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm sm:text-base">
                  {new Date(dateRange.start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} - {" "}
                  {new Date(dateRange.end).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </button>

              {showDatePicker ? (
                <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      max={dateRange.end || undefined}
                      onChange={(e) => {
                        setPeriod("custom");
                        setDateRange((prev) => ({ ...prev, start: e.target.value }));
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      min={dateRange.start || undefined}
                      onChange={(e) => {
                        setPeriod("custom");
                        setDateRange((prev) => ({ ...prev, end: e.target.value }));
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <select
              className="rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.05)] outline-none sm:text-base"
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
            >
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-year">Last Year</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card title="Total Sale" value={formatINR(metrics.totalSale)} trend={`${metrics.totalSaleChange >= 0 ? "+" : ""}${metrics.totalSaleChange.toFixed(1)}%`} />
          <Card title="Avg Selling Price Per Article" value={formatINR(metrics.avgSellingPrice)} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Card title="Avg Sale" value={formatINR(metrics.avgSalePerDay)} />
          <Card title="Current Inventory Value" value={formatINR(metrics.inventoryValue)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Sale vs Expenses</h2>
            <div className="mt-6">
              <SalesExpenseChart points={trendSeries} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Slow Moving Stock</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-sm text-slate-600 sm:text-base">
                      <th className="px-5 py-4 font-semibold">Product No</th>
                      <th className="px-5 py-4 font-semibold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowMovingRows.map((item, index) => (
                      <tr key={`${item.productNo}-${index}`} className="border-t border-slate-200 text-sm text-slate-700 sm:text-base">
                        <td className="px-5 py-4">{item.productNo}</td>
                        <td className="px-5 py-4">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-slate-200 text-sm text-slate-600 sm:text-base">
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Total Sale</th>
                  <th className="px-5 py-4 font-semibold">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {dateTableRows.map((row, index) => (
                  <tr key={`${row.date}-${index}`} className="border-b border-slate-200 text-sm text-slate-700 last:border-b-0 sm:text-base">
                    <td className="px-5 py-4">{row.date}</td>
                    <td className="px-5 py-4">{row.totalSale}</td>
                    <td className="px-5 py-4">{row.quantity}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 text-sm font-semibold text-slate-800 sm:text-base">
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">Total</td>
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">{formatINR(dateTableTotals.totalSaleAmount)}</td>
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">{dateTableTotals.quantity}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Payment Distribution</h2>
            <div className="mt-4">
              <PaymentPieChart values={paymentDistribution} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Top Articles Sold</h2>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="text-sm text-slate-600 sm:text-base">
                      <th className="px-5 py-4 font-semibold">Product No</th>
                      <th className="px-5 py-4 font-semibold">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topArticlesRows.map((item, index) => (
                      <tr key={`${item.productNo}-${index}`} className="border-t border-slate-200 text-sm text-slate-700 sm:text-base">
                        <td className="px-5 py-4">{item.productNo}</td>
                        <td className="px-5 py-4">{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
