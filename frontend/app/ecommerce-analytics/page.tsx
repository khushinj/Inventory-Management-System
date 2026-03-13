"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api } from "../../lib/api";

type Period = "last-month" | "last-3-months" | "last-6-months" | "last-year" | "custom";

type OnlineEntry = {
  dno?: string;
  qty?: number;
  date?: string;
  formType?: string;
  platform?: string;
  mrp?: number;
};

type OnlineDailyReport = {
  date: string;
  totalSale?: number;
  totalReturns?: number;
  totalQuantity?: number;
  amountReceived?: number;
  myntraQty?: number;
  ajioQty?: number;
  amazonQty?: number;
  flipkartQty?: number;
  snapdealQty?: number;
  websiteQty?: number;
  myntraPrice?: number;
  ajioPrice?: number;
  amazonPrice?: number;
  flipkartPrice?: number;
  snapdealPrice?: number;
  websitePrice?: number;
  myntraAmountReceived?: number;
  ajioAmountReceived?: number;
  amazonAmountReceived?: number;
  flipkartAmountReceived?: number;
  snapdealAmountReceived?: number;
  websiteAmountReceived?: number;
};

type JobCard = {
  designNumber?: string;
  mrp?: number;
};

type OnlineInventoryItem = {
  dno: string;
  color: string;
  size: string;
  stock: number;
  inbound: number;
  outbound: number;
  
};

type TrendPoint = {
  dateIso: string;
  label: string;
  sales: number;
  returns: number;
  qty: number;
  returnQty: number;
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

function getInclusiveDays(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 1;
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return 1;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
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

function normalizeDno(dno?: string) {
  return (dno || "").trim().replace(/\s+/g, "").toUpperCase();
}

function toIsoDate(value?: string) {
  if (!value) return "";
  return value.split("T")[0] || "";
}

function getReportTotalAmountReceived(report: OnlineDailyReport) {
  return (
    (report.myntraAmountReceived || 0) +
    (report.ajioAmountReceived || 0) +
    (report.amazonAmountReceived || 0) +
    (report.flipkartAmountReceived || 0) +
    (report.snapdealAmountReceived || 0) +
    (report.websiteAmountReceived || 0)
  );
}

function getReportTotalQty(report: OnlineDailyReport) {
  const qtyFromPlatforms =
    (report.myntraQty || 0) +
    (report.ajioQty || 0) +
    (report.amazonQty || 0) +
    (report.flipkartQty || 0) +
    (report.snapdealQty || 0) +
    (report.websiteQty || 0);

  if (qtyFromPlatforms > 0) return qtyFromPlatforms;
  return report.totalQuantity || 0;
}

function getReportTotalReturns(report: OnlineDailyReport) {
  const returnsFromPlatforms =
    (report.myntraPrice || 0) +
    (report.ajioPrice || 0) +
    (report.amazonPrice || 0) +
    (report.flipkartPrice || 0) +
    (report.snapdealPrice || 0) +
    (report.websitePrice || 0);

  if (returnsFromPlatforms > 0) return returnsFromPlatforms;
  return report.totalReturns || 0;
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

function SalesReturnsChart({ points }: { points: TrendPoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxSales = Math.max(...points.map((p) => p.sales), 1);
  const maxReturns = Math.max(...points.map((p) => p.returns), 1);
  const max = Math.max(maxSales, maxReturns, 1);
  const step = Math.ceil(max / 5 / 1000) * 1000;
  const yMax = step * 5;
  const width = 900;
  const height = 400;
  const padLeft = 80;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 60;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const xStep = points.length > 1 ? chartWidth / (points.length - 1) : 0;

  const salesPath =
    points.length > 0
      ? "M " +
        points
          .map((p, i) => {
            const x = padLeft + i * xStep;
            const y = padTop + chartHeight - (p.sales / yMax) * chartHeight;
            return `${x},${y}`;
          })
          .join(" L ")
      : "";

  const returnsPath =
    points.length > 0
      ? "M " +
        points
          .map((p, i) => {
            const x = padLeft + i * xStep;
            const y = padTop + chartHeight - (p.returns / yMax) * chartHeight;
            return `${x},${y}`;
          })
          .join(" L ")
      : "";

  const displayedDates = useMemo(() => pickDatesForChart(points.map((p) => p.dateIso), 8), [points]);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <defs>
          <linearGradient id="sales-gradient-online" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="returns-gradient-online" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: 6 }).map((_, i) => {
          const val = (5 - i) * step;
          const y = padTop + (chartHeight * i) / 5;
          return (
            <g key={i}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={padLeft - 10} y={y} textAnchor="end" alignmentBaseline="middle" fill="#64748b" fontSize="14">
                {(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {points.map((p, i) => {
          const x = padLeft + i * xStep;
          const showLabel = displayedDates.includes(p.dateIso);
          return showLabel ? (
            <text
              key={p.dateIso}
              x={x}
              y={height - padBottom + 20}
              textAnchor="middle"
              fill="#64748b"
              fontSize="14"
            >
              {formatDateLabel(p.label)}
            </text>
          ) : null;
        })}

        {salesPath ? <path d={salesPath + ` L ${width - padRight},${padTop + chartHeight} L ${padLeft},${padTop + chartHeight} Z`} fill="url(#sales-gradient-online)" /> : null}
        {salesPath ? <path d={salesPath} fill="none" stroke="#3b82f6" strokeWidth="3" /> : null}

        {returnsPath ? <path d={returnsPath + ` L ${width - padRight},${padTop + chartHeight} L ${padLeft},${padTop + chartHeight} Z`} fill="url(#returns-gradient-online)" /> : null}
        {returnsPath ? <path d={returnsPath} fill="none" stroke="#ef4444" strokeWidth="3" /> : null}

        {points.map((p, i) => {
          const x = padLeft + i * xStep;
          const ySales = padTop + chartHeight - (p.sales / yMax) * chartHeight;
          const yReturns = padTop + chartHeight - (p.returns / yMax) * chartHeight;
          return (
            <g key={`point-${i}`}>
              <circle
                cx={x}
                cy={ySales}
                r="5"
                fill="#3b82f6"
                stroke="#ffffff"
                strokeWidth="2"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              <circle
                cx={x}
                cy={yReturns}
                r="5"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="2"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            </g>
          );
        })}
      </svg>

      {hoveredIndex !== null ? (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-lg bg-slate-900/95 px-4 py-2 text-sm text-white shadow-lg">
          <div className="font-semibold">{formatDateLabel(points[hoveredIndex].label)}</div>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span>Sales: {formatINR(points[hoveredIndex].sales)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Returns: {formatINR(points[hoveredIndex].returns)}</span>
            </div>
            <div className="mt-1 text-xs text-slate-300">
              Qty: {points[hoveredIndex].qty} | Return Qty: {points[hoveredIndex].returnQty}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-slate-600">sale</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-slate-600">returns</span>
        </div>
      </div>
    </div>
  );
}

function PlatformPieChart({ values }: { values: { amazon: number; flipkart: number; myntra: number; snapdeal: number; ajio: number; website: number } }) {
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);
  const total = values.amazon + values.flipkart + values.myntra + values.snapdeal + values.ajio + values.website;
  const normalized = total > 0 ? values : { amazon: 0, flipkart: 0, myntra: 0, snapdeal: 0, ajio: 0, website: 0 };
  const normalizedTotal = normalized.amazon + normalized.flipkart + normalized.myntra + normalized.snapdeal + normalized.ajio + normalized.website;
  const slices = [
    { key: "amazon", label: "Amazon", value: normalized.amazon, color: "#ff9900" },
    { key: "flipkart", label: "Flipkart", value: normalized.flipkart, color: "#047bd5" },
    { key: "myntra", label: "Myntra", value: normalized.myntra, color: "#f13ab1" },
    { key: "snapdeal", label: "Snapdeal", value: normalized.snapdeal, color: "#e40046" },
    { key: "ajio", label: "Ajio", value: normalized.ajio, color: "#c29d4f" },
    { key: "website", label: "Website", value: normalized.website, color: "#10b981" },
  ].filter(s => s.value > 0);

  const size = 360;
  const center = size / 2;
  const radius = 126;

  const paths = (normalizedTotal > 0 && slices.length > 0 ? slices : [{ key: "none", label: "No Data", value: 1, color: "#94a3b8" }])
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

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="h-[340px] w-[340px]">
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
      </svg>

      {paths.map((slice) => {
        const labelRadius = radius + 40;
        const x = center + labelRadius * Math.cos((Math.PI * slice.midAngle) / 180);
        const y = center + labelRadius * Math.sin((Math.PI * slice.midAngle) / 180);
        return (
          <p
            key={`label-${slice.label}`}
            className="pointer-events-none absolute text-base font-medium sm:text-xl"
            style={{
              left: `${(x / size) * 100}%`,
              top: `${(y / size) * 100}%`,
              color: slice.color,
              transform: "translate(-50%, -50%)",
            }}
          >
            {slice.label} {slice.pct}%
          </p>
        );
      })}

      {hoveredSlice ? (
        <div className="absolute bottom-1 rounded-lg bg-slate-900/95 px-3 py-2 text-xs text-white sm:text-sm">
          {(() => {
            const current = paths.find((slice) => slice.label === hoveredSlice);
            if (!current) return null;
            const qty = slices.find((slice) => slice.label === hoveredSlice)?.value || 0;
            return `${hoveredSlice}: ${qty} units (${current.pct}%)`;
          })()}
        </div>
      ) : null}
    </div>
  );
}

export default function EcommerceAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("last-month");
  const [dateRange, setDateRange] = useState<DateRange>(() => getDateRangeByPeriod("last-month"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [onlineEntries, setOnlineEntries] = useState<OnlineEntry[]>([]);
  const [onlineDailyReports, setOnlineDailyReports] = useState<OnlineDailyReport[]>([]);
  const [onlineInventory, setOnlineInventory] = useState<OnlineInventoryItem[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  useEffect(() => {
    if (period === "custom") return;
    setDateRange(getDateRangeByPeriod(period));
  }, [period]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [onlineRes, inventoryRes, jobCardRes, dailyReportRes] = await Promise.all([
        api.get("/warehouse/online"),
        api.get("/inventory/warehouse/online"),
        api.get("/jobcard"),
        api.get("/online-daily-report"),
      ]);

      setOnlineEntries(Array.isArray(onlineRes.data) ? onlineRes.data : []);
      setOnlineInventory(Array.isArray(inventoryRes.data?.inventory) ? inventoryRes.data.inventory : []);
      setJobCards(Array.isArray(jobCardRes.data) ? jobCardRes.data : []);
      setOnlineDailyReports(Array.isArray(dailyReportRes.data?.data) ? dailyReportRes.data.data : []);
    } catch (error) {
      console.error("Error loading ecommerce analytics:", error);
      setOnlineEntries([]);
      setOnlineInventory([]);
      setJobCards([]);
      setOnlineDailyReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const inventoryDesignSet = useMemo(() => {
    return new Set(onlineInventory.map((item) => normalizeDno(item.dno)));
  }, [onlineInventory]);

  const mrpMap = useMemo(() => {
    const map = new Map<string, number>();
    jobCards.forEach((card) => {
      if (card.designNumber && card.mrp) {
        map.set(normalizeDno(card.designNumber), card.mrp);
      }
    });
    return map;
  }, [jobCards]);

  const getUnitAmount = useCallback(
    (designNumber?: string) => {
      if (!designNumber) return 0;
      const normalized = normalizeDno(designNumber);
      if (!inventoryDesignSet.has(normalized)) return 0;
      return mrpMap.get(normalized) || 0;
    },
    [inventoryDesignSet, mrpMap]
  );

  const inRangeSalesEntries = useMemo(() => {
    return onlineEntries.filter((entry) => {
      if (entry.formType !== "sales") return false;
      const dateIso = toIsoDate(entry.date);
      return dateIso >= dateRange.start && dateIso <= dateRange.end;
    });
  }, [dateRange.end, dateRange.start, onlineEntries]);

  const inRangeReturnEntries = useMemo(() => {
    return onlineEntries.filter((entry) => {
      if (entry.formType !== "return") return false;
      const dateIso = toIsoDate(entry.date);
      return dateIso >= dateRange.start && dateIso <= dateRange.end;
    });
  }, [dateRange.end, dateRange.start, onlineEntries]);

  const allSalesEntries = useMemo(() => {
    return onlineEntries.filter((entry) => entry.formType === "sales");
  }, [onlineEntries]);

  const filteredReports = useMemo(() => {
    return onlineDailyReports
      .filter((r) => {
        const d = toIsoDate(r.date);
        return d >= dateRange.start && d <= dateRange.end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [onlineDailyReports, dateRange.start, dateRange.end]);

  const metrics = useMemo(() => {
    const totalSale = filteredReports.reduce((sum, r) => sum + getReportTotalAmountReceived(r), 0);
    const totalQty = filteredReports.reduce((sum, r) => sum + getReportTotalQty(r), 0);
    const selectedDays = getInclusiveDays(dateRange.start, dateRange.end);
    const avgDailySalesQty = totalQty / selectedDays;

    // Aggregate inventory by design number and calculate total value
    const designQuantityMap = new Map<string, number>();
    
    onlineInventory.forEach((item) => {
      if (item.dno && item.stock > 0) {
        const normalizedDno = normalizeDno(item.dno); 
        const currentQty = designQuantityMap.get(normalizedDno) || 0;
        designQuantityMap.set(normalizedDno, currentQty + item.stock);
      }
    });

    // Calculate inventory value by multiplying aggregated qty with MRP from job cards
    const inventoryValue = Array.from(designQuantityMap.entries()).reduce((sum, [dno, quantity]) => {
      const mrp = mrpMap.get(dno) || 0;
      return sum + quantity * mrp;
    }, 0);

    return {
      totalSale,
      avgDailySalesQty,
      inventoryValue,
    };
  }, [filteredReports, onlineInventory, mrpMap, dateRange.start, dateRange.end]);

  const trendSeries = useMemo<TrendPoint[]>(() => {
    const returnsByDate = inRangeReturnEntries.reduce<Record<string, { value: number; qty: number }>>((acc, entry) => {
      const dateIso = toIsoDate(entry.date);
      if (!dateIso) return acc;
      const mrp = getUnitAmount(entry.dno);
      if (!acc[dateIso]) acc[dateIso] = { value: 0, qty: 0 };
      acc[dateIso].value += (entry.qty || 0) * mrp;
      acc[dateIso].qty += entry.qty || 0;
      return acc;
    }, {});

    // Generate every date in range
    const allDates: string[] = [];
    const cursor = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    while (cursor <= endDate) {
      allDates.push(cursor.toISOString().split("T")[0]);
      cursor.setDate(cursor.getDate() + 1);
    }

    if (allDates.length === 0) {
      return [{ dateIso: "", label: "No Data", sales: 0, returns: 0, qty: 0, returnQty: 0 }];
    }

    const saleByDate = new Map<string, { totalSale: number; totalQuantity: number }>();
    filteredReports.forEach((r) => {
      const d = toIsoDate(r.date);
      if (d) saleByDate.set(d, { totalSale: getReportTotalAmountReceived(r), totalQuantity: getReportTotalQty(r) });
    });

    return allDates.map((dateIso) => {
      const report = saleByDate.get(dateIso);
      const ret = returnsByDate[dateIso];
      return {
        dateIso,
        label: formatDateLabel(dateIso),
        sales: Math.round(report?.totalSale || 0),
        returns: Math.round(ret?.value || 0),
        qty: report?.totalQuantity || 0,
        returnQty: ret?.qty || 0,
      };
    });
  }, [dateRange.start, dateRange.end, filteredReports, inRangeReturnEntries, getUnitAmount]);

  const tableRows = useMemo(() => {
    const reportByDate = filteredReports.reduce<Record<string, { amountReceived: number; totalQuantity: number; totalReturns: number }>>((acc, report) => {
      const dateIso = toIsoDate(report.date);
      if (!dateIso) return acc;
      acc[dateIso] = {
        amountReceived: getReportTotalAmountReceived(report),
        totalQuantity: getReportTotalQty(report),
        totalReturns: getReportTotalReturns(report),
      };
      return acc;
    }, {});

    const sorted = Object.keys(reportByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return sorted.map((dateIso) => ({
      date: new Date(dateIso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      totalSaleAmount: reportByDate[dateIso]?.amountReceived || 0,
      totalSale: formatINR(reportByDate[dateIso]?.amountReceived || 0),
      quantity: reportByDate[dateIso]?.totalQuantity || 0,
      returnQty: reportByDate[dateIso]?.totalReturns || 0,
    }));
  }, [filteredReports]);

  const tableTotals = useMemo(() => {
    return tableRows.reduce(
      (acc, row) => ({
        totalSaleAmount: acc.totalSaleAmount + row.totalSaleAmount,
        quantity: acc.quantity + row.quantity,
        returnQty: acc.returnQty + row.returnQty,
      }),
      { totalSaleAmount: 0, quantity: 0, returnQty: 0 }
    );
  }, [tableRows]);

  const slowMoving = useMemo(() => {
    // Aggregate inventory by design number
    const inventoryByDesign = new Map<string, number>();
    onlineInventory.forEach((item) => {
      if (item.dno && item.stock > 0) {
        const key = normalizeDno(item.dno);
        const current = inventoryByDesign.get(key) || 0;
        inventoryByDesign.set(key, current + item.stock);
      }
    });

    // Count sales by design number
    const salesCount = inRangeSalesEntries.reduce<Record<string, number>>((acc, entry) => {
      if (!entry.dno) return acc;
      const key = normalizeDno(entry.dno);
      acc[key] = (acc[key] || 0) + (entry.qty || 0);
      return acc;
    }, {});

    // Calculate slow moving items
    return Array.from(inventoryByDesign.entries())
      .map(([dno, stock]) => {
        const sold = salesCount[dno] || 0;
        const ratio = sold > 0 ? stock / sold : stock * 1000;
        return { productNo: dno, quantity: stock, ratio };
      })
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, 10);
  }, [onlineInventory, inRangeSalesEntries]);

  const topArticles = useMemo(() => {
    const salesCount = inRangeSalesEntries.reduce<Record<string, number>>((acc, entry) => {
      if (!entry.dno) return acc;
      const key = normalizeDno(entry.dno);
      acc[key] = (acc[key] || 0) + (entry.qty || 0);
      return acc;
    }, {});

    return Object.entries(salesCount)
      .map(([dno, qty]) => ({ productNo: dno, quantity: qty }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [inRangeSalesEntries]);

  const platformDistribution = useMemo(() => {
    return inRangeSalesEntries.reduce(
      (acc, item) => {
        const key = (item.platform || "").trim().toLowerCase();
        const qty = item.qty || 0;

        if (key === "amazon") acc.amazon += qty;
        else if (key === "flipkart") acc.flipkart += qty;
        else if (key === "myntra") acc.myntra += qty;
        else if (key === "snapdeal") acc.snapdeal += qty;
        else if (key === "ajio") acc.ajio += qty;
        else if (key === "website") acc.website += qty;

        return acc;
      },
      { amazon: 0, flipkart: 0, myntra: 0, snapdeal: 0, ajio: 0, website: 0 }
    );
  }, [inRangeSalesEntries]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-6">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-slate-800" />
            <p className="mt-4 text-slate-600">Loading e-commerce analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-[1320px]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">E-Commerce Inventory</h1>

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
          <Card title="Total Amount Received" value={formatINR(metrics.totalSale)} />
          <Card title="Avg Daily sales(Qty)" value={`${Math.round(metrics.avgDailySalesQty)} pcs`} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-1">
          <Card title="Current Inventory Value" value={formatINR(metrics.inventoryValue)} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Sale vs Returns</h2>
            <div className="mt-6">
              <SalesReturnsChart points={trendSeries} />
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
                    {slowMoving.map((item, index) => (
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
                  <th className="px-5 py-4 font-semibold">Total Amount Received</th>
                  <th className="px-5 py-4 font-semibold">Qty</th>
                  <th className="px-5 py-4 font-semibold">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, index) => (
                  <tr key={`${row.date}-${index}`} className="border-b border-slate-200 text-sm text-slate-700 last:border-b-0 sm:text-base">
                    <td className="px-5 py-4">{row.date}</td>
                    <td className="px-5 py-4">{row.totalSale}</td>
                    <td className="px-5 py-4">{row.quantity}</td>
                    <td className="px-5 py-4">{row.returnQty}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 text-sm font-semibold text-slate-800 sm:text-base">
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">Total</td>
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">{formatINR(tableTotals.totalSaleAmount)}</td>
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">{tableTotals.quantity}</td>
                  <td className="sticky bottom-0 bg-slate-50 px-5 py-4">{tableTotals.returnQty}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">Platform Distribution</h2>
            <div className="mt-4">
              <PlatformPieChart values={platformDistribution} />
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
                    {topArticles.map((item, index) => (
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
