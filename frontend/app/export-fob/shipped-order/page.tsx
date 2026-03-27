"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { Plus, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";

type ShippedOrderEntry = {
  _id?: string;
  designNumber: string;
  status: "In Cutting" | "In Stitching" | "In Finishing" | "Packed" | "Shipped";
};

type StatusCounts = {
  "In Cutting": number;
  "In Stitching": number;
  "In Finishing": number;
  Packed: number;
  Shipped: number;
};

const STATUS_OPTIONS = ["In Cutting", "In Stitching", "In Finishing", "Packed", "Shipped"] as const;

const STATUS_COLORS: Record<string, string> = {
  "In Cutting": "bg-blue-100 text-blue-700 border-blue-300",
  "In Stitching": "bg-purple-100 text-purple-700 border-purple-300",
  "In Finishing": "bg-orange-100 text-orange-700 border-orange-300",
  Packed: "bg-green-100 text-green-700 border-green-300",
  Shipped: "bg-gray-100 text-gray-700 border-gray-300",
};

export default function ShippedOrderPage() {
  const [entries, setEntries] = useState<ShippedOrderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempValues, setTempValues] = useState<Record<string, Partial<ShippedOrderEntry>>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/shipped-order");
      if (res.data && (res.data.success || Array.isArray(res.data))) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching shipped orders:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = (): StatusCounts => {
    return {
      "In Cutting": entries.filter((e) => e.status === "In Cutting").length,
      "In Stitching": entries.filter((e) => e.status === "In Stitching").length,
      "In Finishing": entries.filter((e) => e.status === "In Finishing").length,
      Packed: entries.filter((e) => e.status === "Packed").length,
      Shipped: entries.filter((e) => e.status === "Shipped").length,
    };
  };

  const visibleIds = useMemo(
    () => entries.map((entry) => entry._id).filter((id): id is string => Boolean(id)),
    [entries]
  );

  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(visibleIds));
  };

  const toggleSelection = (id: string | undefined) => {
    if (!id) return;
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleAddRow = () => {
    const newId = `temp-${Date.now()}`;
    const newEntry: ShippedOrderEntry = {
      _id: newId,
      designNumber: "",
      status: "In Cutting",
    };
    setEntries([...entries, newEntry]);
    setTempValues({
      ...tempValues,
      [newId]: newEntry,
    });
  };

  const handleDeleteRow = async (id: string | undefined) => {
    if (!id) return;

    const confirmed = window.confirm("Are you sure you want to delete this row?");
    if (!confirmed) return;

    if (id.startsWith("temp-")) {
      setEntries(entries.filter((entry) => entry._id !== id));
      const nextSelected = new Set(selectedIds);
      nextSelected.delete(id);
      setSelectedIds(nextSelected);
      return;
    }

    try {
      await api.delete(`/shipped-order/${id}`);
      setEntries(entries.filter((entry) => entry._id !== id));
      const nextSelected = new Set(selectedIds);
      nextSelected.delete(id);
      setSelectedIds(nextSelected);
    } catch (error) {
      console.error("Error deleting shipped order:", error);
      alert("Failed to delete row");
    }
  };

  const handleCellChange = (
    id: string | undefined,
    field: keyof ShippedOrderEntry,
    value: string
  ) => {
    if (!id) return;

    setTempValues({
      ...tempValues,
      [id]: {
        ...tempValues[id],
        [field]: value,
      },
    });
  };

  const handleCellBlur = async (id: string | undefined, field: keyof ShippedOrderEntry) => {
    if (!id) return;

    const entry = entries.find((e) => e._id === id);
    const newValue = tempValues[id]?.[field];

    if (newValue === undefined || entry?.[field] === newValue) {
      return;
    }

    setEntries(entries.map((e) => (e._id === id ? { ...e, [field]: newValue as any } : e)));

    if (id.startsWith("temp-")) {
      return;
    }

    try {
      await api.put(`/shipped-order/${id}`, {
        [field]: newValue,
      });
    } catch (error) {
      console.error("Error updating shipped order:", error);
      alert("Failed to update entry");
    }
  };

  const handleSaveNewEntries = async () => {
    const newEntries = entries.filter((entry) => entry._id?.startsWith("temp-"));

    if (newEntries.length === 0) {
      alert("No new rows to save");
      return;
    }

    for (const entry of newEntries) {
      if (!entry.designNumber) {
        alert("Please fill Design Number for all new rows");
        return;
      }
    }

    try {
      const savedEntries = await Promise.all(
        newEntries.map((entry) =>
          api.post("/shipped-order", {
            designNumber: entry.designNumber,
            status: entry.status,
          })
        )
      );

      setEntries(
        entries.map((entry) => {
          if (entry._id?.startsWith("temp-")) {
            const savedIndex = newEntries.findIndex((newEntry) => newEntry._id === entry._id);
            if (savedIndex >= 0 && savedEntries[savedIndex].data?.data) {
              return savedEntries[savedIndex].data.data;
            }
          }
          return entry;
        })
      );
      setTempValues({});
      alert("Rows saved successfully");
    } catch (error) {
      console.error("Error saving shipped orders:", error);
      alert("Failed to save new rows");
    }
  };

  const handleExportExcel = () => {
    const data = entries.map((entry) => ({
      "Design Number": entry.designNumber,
      Status: entry.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipped Orders");
    XLSX.writeFile(wb, "shipped-orders.xlsx");
  };

  const counts = getStatusCounts();
  const hasNewEntries = entries.some((entry) => entry._id?.startsWith("temp-"));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shipped orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold text-gray-900 mb-2">Shipped Order</h1>
          <p className="text-lg md:text-xl text-slate-600">Manage orders and their production status</p>
        </div>

        <div className="bg-white/90 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="w-16 px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-slate-700">Design Number</th>
                  <th className="px-6 py-4 text-left text-xl font-semibold text-slate-700">Status</th>
                  <th className="w-16 px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No shipped orders yet. Click "Add Row" to create one.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const displayValues = {
                      designNumber: tempValues[entry._id || ""]?.designNumber ?? entry.designNumber,
                      status: tempValues[entry._id || ""]?.status ?? entry.status,
                    };

                    return (
                      <tr key={entry._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={entry._id ? selectedIds.has(entry._id) : false}
                            onChange={() => toggleSelection(entry._id)}
                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.designNumber}
                            onChange={(e) => handleCellChange(entry._id, "designNumber", e.target.value)}
                            onBlur={() => handleCellBlur(entry._id, "designNumber")}
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                            placeholder="DSN-001"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={displayValues.status}
                            onChange={(e) => handleCellChange(entry._id, "status", e.target.value)}
                            onBlur={() => handleCellBlur(entry._id, "status")}
                            className={`w-full rounded-xl border px-4 py-3 text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 ${
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
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteRow(entry._id)}
                            className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-6 h-6" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-200 p-4">
            <button
              onClick={handleAddRow}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Row
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-5">
          {STATUS_OPTIONS.map((status) => (
            <div key={status} className={`rounded-2xl border p-6 ${STATUS_COLORS[status]}`}>
              <p className="text-4xl font-semibold">{counts[status]}</p>
              <p className="mt-2 text-xl font-medium">{status}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3 justify-end flex-wrap">
          {hasNewEntries && (
            <button
              onClick={handleSaveNewEntries}
              className="rounded-xl bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 transition-colors"
            >
              Save New Entries
            </button>
          )}
          <button
            onClick={handleExportExcel}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-5 w-5" />
            Export to Excel
          </button>
        </div>
      </div>
    </div>
  );
}
