"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

type StockEntry = {
  _id?: string;
  duo: string;
  color: string;
  size: string;
  status: "Packed" | "Shipped";
};

type StatusCounts = {
  "Packed": number;
  "Shipped": number;
};

const STATUS_OPTIONS = ["Packed", "Shipped"] as const;

const STATUS_COLORS: Record<string, string> = {
  "Packed": "bg-green-100 text-green-800 border-green-300",
  "Shipped": "bg-gray-100 text-gray-800 border-gray-300",
};

export default function PresentStockPage() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempValues, setTempValues] = useState<Record<string, Pick<StockEntry, "status">>>({});

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLSelectElement>) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const table = e.currentTarget.closest("table");
    if (!table) {
      return;
    }

    const fields = Array.from(table.querySelectorAll<HTMLSelectElement>("select:not([disabled])"));

    const currentIndex = fields.indexOf(e.currentTarget);
    if (currentIndex > -1 && currentIndex < fields.length - 1) {
      fields[currentIndex + 1]?.focus();
    }
  }, []);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      // Fetch from present-stock endpoint or create mock data
      const res = await api.get("/present-stock");
      if (res.data && (res.data.success || Array.isArray(res.data))) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        const normalizedData: StockEntry[] = data.map((entry: any) => ({
          ...entry,
          status: entry.status === "Shipped" ? "Shipped" : "Packed",
        }));
        setEntries(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
      // Start with empty array if API fails
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = (): StatusCounts => {
    return {
      "Packed": entries.filter((e) => e.status === "Packed").length,
      "Shipped": entries.filter((e) => e.status === "Shipped").length,
    };
  };

  const handleStatusChange = (id: string | undefined, value: StockEntry["status"]) => {
    if (!id) return;

    setTempValues({
      ...tempValues,
      [id]: {
        ...tempValues[id],
        status: value,
      },
    });
  };

  const handleStatusBlur = async (id: string | undefined) => {
    if (!id) return;

    const entry = entries.find((e) => e._id === id);
    const newValue = tempValues[id]?.status;

    if (newValue === undefined || entry?.status === newValue) {
      return;
    }

    setEntries(entries.map((e) => (e._id === id ? { ...e, status: newValue } : e)));

    try {
      await api.put(`/present-stock/${id}`, {
        status: newValue,
      });
    } catch (error) {
      console.error("Error updating entry:", error);
      alert("Failed to update entry");
    }
  };

  const handleExportExcel = () => {
    const data = entries.map((e) => ({
      DUO: e.duo,
      Colour: e.color,
      Size: e.size,
      Status: e.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Present Stock");
    XLSX.writeFile(wb, "present-stock.xlsx");
  };

  const counts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Present Stock</h1>
          <p className="text-lg text-gray-600">View stock details and update status only</p>
        </div>

        {/* Status Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {STATUS_OPTIONS.map((status) => {
            const count = counts[status];
            return (
              <div
                key={status}
                className={`rounded-lg p-6 text-center border-2 ${STATUS_COLORS[status]}`}
              >
                <div className="text-3xl font-bold">{count}</div>
                <div className="text-sm font-medium mt-2">{status}</div>
              </div>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DUO</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Colour</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No stock entries found.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const displayValues = {
                      status: tempValues[entry._id || ""]?.status ?? entry.status,
                    };

                    return (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        {/* DUO */}
                        <td className="px-6 py-4">
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                            {entry.duo || "-"}
                          </div>
                        </td>

                        {/* Colour */}
                        <td className="px-6 py-4">
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                            {entry.color || "-"}
                          </div>
                        </td>

                        {/* Size */}
                        <td className="px-6 py-4">
                          <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900">
                            {entry.size || "-"}
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={displayValues.status}
                            onChange={(e) =>
                              handleStatusChange(entry._id, e.target.value as StockEntry["status"])
                            }
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleStatusBlur(entry._id)}
                            className={`w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-medium text-gray-900 ${
                              STATUS_COLORS[displayValues.status]
                            }`}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 justify-end flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={entries.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export to Excel
          </button>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> This page is read-only for DUO, Colour, and Size. Only status can be updated.
          </p>
        </div>
      </div>
    </div>
  );
}
