"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Filter, Download } from "lucide-react";
import * as XLSX from "xlsx";

type ExportFobItem = {
  _id: string;
  designNumber: string;
  status: "In Cutting" | "In Stitching" | "In Finishing" | "Packed" | "Shipped";
  qty: number;
  type: "production-tracking" | "present-stock";
  color: string | null;
  size: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AnalyticsData = {
  items: ExportFobItem[];
  statusCounts: Record<string, number>;
  totalItems: number;
  filteredCount: number;
  filteredRecords: number;
  selectedStatus: string | null;
};

const STATUS_OPTIONS = ["In Cutting", "In Stitching", "In Finishing", "Packed", "Shipped"] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "In Cutting": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  "In Stitching": {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  "In Finishing": {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  Packed: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  Shipped: {
    bg: "bg-gray-50",
    text: "text-gray-700",
    border: "border-gray-200",
  },
};

export default function ExportFobAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData>({
    items: [],
    statusCounts: {},
    totalItems: 0,
    filteredCount: 0,
    filteredRecords: 0,
    selectedStatus: null,
  });
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = selectedStatus ? `?status=${encodeURIComponent(selectedStatus)}` : "";
      const res = await api.get(`/analytics/export-fob${params}`);

      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching export-fob analytics:", error);
      setData({
        items: [],
        statusCounts: {},
        totalItems: 0,
        filteredCount: 0,
        filteredRecords: 0,
        selectedStatus: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (status: string) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const handleExport = () => {
    if (data.items.length === 0) {
      alert("No data to export");
      return;
    }

    const exportData = data.items.map((item) => ({
      "Design Number": item.designNumber,
      "Status": item.status,
      Qty: item.qty,
      "Color": item.color || "-",
      "Size": item.size || "-",
      "Remarks": item.remarks || "-",
      "Created Date": new Date(item.createdAt).toLocaleDateString(),
      "Updated Date": new Date(item.updatedAt).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Export FOB Analytics");

    const filename = `export-fob-analytics-${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Export/FOB Analytics</h1>
        </div>

        {/* Status Filter Buttons */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filter by Status</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {STATUS_OPTIONS.map((status) => {
              const count = data.statusCounts[status] || 0;
              const isSelected = selectedStatus === status;
              const colors = STATUS_COLORS[status];

              return (
                <button
                  key={status}
                  onClick={() => handleStatusClick(status)}
                  className={`px-6 py-3 rounded-lg border-2 font-semibold transition-all ${
                    isSelected
                      ? `${colors.bg} ${colors.text} ${colors.border} border-2 ring-2 ring-offset-2 ring-${colors.text.split("-")[1]}-300`
                      : `${colors.bg} ${colors.text} ${colors.border} border-2 hover:shadow-md`
                  }`}
                >
                  <span className="text-base">{status}</span>
                  <span className="ml-2 font-bold text-lg">{count} qty</span>
                </button>
              );
            })}
          </div>


        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Export/FOB Records</h2>
            <button
              onClick={handleExport}
              disabled={data.items.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading data...</p>
            </div>
          ) : data.items.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No data found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Design Number</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Color</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Size</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Remarks</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => {
                    const colors = STATUS_COLORS[item.status];
                    return (
                      <tr
                        key={item._id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50 hover:bg-gray-100 transition-colors"}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {item.designNumber || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{item.qty}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.color || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.size || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.remarks || "-"}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(item.updatedAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
