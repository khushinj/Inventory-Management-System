"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Plus, Trash2, Download } from "lucide-react";
import * as XLSX from "xlsx";

type StockEntry = {
  _id?: string;
  duo: string;
  color: string;
  size: string;
  status: "In Cutting" | "In Stitching" | "In Finishing" | "Packed" | "Shipped";
};

type StatusCounts = {
  "In Cutting": number;
  "In Stitching": number;
  "In Finishing": number;
  "Packed": number;
  "Shipped": number;
};

const STATUS_OPTIONS = ["In Cutting", "In Stitching", "In Finishing", "Packed", "Shipped"] as const;

const STATUS_COLORS: Record<string, string> = {
  "In Cutting": "bg-blue-100 text-blue-800 border-blue-300",
  "In Stitching": "bg-purple-100 text-purple-800 border-purple-300",
  "In Finishing": "bg-orange-100 text-orange-800 border-orange-300",
  "Packed": "bg-green-100 text-green-800 border-green-300",
  "Shipped": "bg-gray-100 text-gray-800 border-gray-300",
};

export default function PresentStockPage() {
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [tempValues, setTempValues] = useState<Record<string, Partial<StockEntry>>>({});

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
        setEntries(data);
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
      "In Cutting": entries.filter((e) => e.status === "In Cutting").length,
      "In Stitching": entries.filter((e) => e.status === "In Stitching").length,
      "In Finishing": entries.filter((e) => e.status === "In Finishing").length,
      "Packed": entries.filter((e) => e.status === "Packed").length,
      "Shipped": entries.filter((e) => e.status === "Shipped").length,
    };
  };

  const handleAddRow = () => {
    const newId = `temp-${Date.now()}`;
    const newEntry: StockEntry = {
      _id: newId,
      duo: "",
      color: "",
      size: "",
      status: "In Cutting",
    };
    setEntries([...entries, newEntry]);
    setEditingIds(new Set([...editingIds, newId]));
    setTempValues({
      ...tempValues,
      [newId]: newEntry,
    });
  };

  const handleDeleteRow = async (id: string | undefined) => {
    if (!id) {
      // For new unsaved entries, just remove from state
      setEntries(entries.filter((e) => e._id !== id));
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;

    try {
      await api.delete(`/present-stock/${id}`);
      setEntries(entries.filter((e) => e._id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    }
  };

  const handleCellClick = (id: string | undefined) => {
    if (!id) return;
    const newEditingIds = new Set(editingIds);
    if (newEditingIds.has(id)) {
      newEditingIds.delete(id);
    } else {
      newEditingIds.add(id);
    }
    setEditingIds(newEditingIds);
  };

  const handleCellChange = (
    id: string | undefined,
    field: keyof StockEntry,
    value: string
  ) => {
    if (!id) return;

    const entry = entries.find((e) => e._id === id);
    if (!entry) return;

    setTempValues({
      ...tempValues,
      [id]: {
        ...tempValues[id],
        [field]: value,
      },
    });
  };

  const handleCellBlur = async (id: string | undefined, field: keyof StockEntry) => {
    if (!id) return;

    const entry = entries.find((e) => e._id === id);
    const newValue = tempValues[id]?.[field];

    if (newValue === undefined || entry?.[field] === newValue) {
      return;
    }

    // Update local state immediately
    setEntries(
      entries.map((e) =>
        e._id === id ? { ...e, [field]: newValue as any } : e
      )
    );

    // If it's a new entry (temp id), don't save to backend
    if (id.startsWith("temp-")) {
      return;
    }

    // Save to backend
    try {
      await api.put(`/present-stock/${id}`, {
        [field]: newValue,
      });
    } catch (error) {
      console.error("Error updating entry:", error);
      // Revert on error
      const originalEntry = tempValues[id];
      setEntries(
        entries.map((e) =>
          e._id === id ? { ...e, [field]: originalEntry?.[field] } : e
        )
      );
      alert("Failed to update entry");
    }
  };

  const handleSaveNewEntries = async () => {
    const newEntries = entries.filter((e) => e._id?.startsWith("temp-"));
    
    if (newEntries.length === 0) {
      alert("No new entries to save");
      return;
    }

    // Validate entries
    for (const entry of newEntries) {
      if (!entry.duo || !entry.color || !entry.size) {
        alert("Please fill in all required fields (DUO, Colour, Size)");
        return;
      }
    }

    try {
      // Save all new entries
      const savedEntries = await Promise.all(
        newEntries.map((entry) =>
          api.post("/present-stock", {
            duo: entry.duo,
            color: entry.color,
            size: entry.size,
            status: entry.status,
          })
        )
      );

      // Replace temp IDs with real IDs
      setEntries(
        entries.map((e) => {
          if (e._id?.startsWith("temp-")) {
            const savedIndex = newEntries.findIndex((ne) => ne._id === e._id);
            if (savedIndex >= 0 && savedEntries[savedIndex].data) {
              return savedEntries[savedIndex].data;
            }
          }
          return e;
        })
      );

      setEditingIds(new Set());
      setTempValues({});
      alert("Entries saved successfully!");
    } catch (error) {
      console.error("Error saving entries:", error);
      alert("Failed to save entries");
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
  const hasNewEntries = entries.some((e) => e._id?.startsWith("temp-"));

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
          <p className="text-lg text-gray-600">Track your inventory across production stages</p>
        </div>

        {/* Status Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No stock entries yet. Click "Add Row" to create one.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const isEditing = editingIds.has(entry._id || "");
                    const displayValues = {
                      duo: tempValues[entry._id || ""]?.duo ?? entry.duo,
                      color: tempValues[entry._id || ""]?.color ?? entry.color,
                      size: tempValues[entry._id || ""]?.size ?? entry.size,
                      status: tempValues[entry._id || ""]?.status ?? entry.status,
                    };

                    return (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        {/* DUO */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.duo}
                            onChange={(e) =>
                              handleCellChange(entry._id, "duo", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "duo")}
                            onFocus={() => handleCellClick(entry._id)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., DUO-001"
                          />
                        </td>

                        {/* Colour */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.color}
                            onChange={(e) =>
                              handleCellChange(entry._id, "color", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "color")}
                            onFocus={() => handleCellClick(entry._id)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., Red"
                          />
                        </td>

                        {/* Size */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.size}
                            onChange={(e) =>
                              handleCellChange(entry._id, "size", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "size")}
                            onFocus={() => handleCellClick(entry._id)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., M"
                          />
                        </td>

                        {/* Status Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={displayValues.status}
                            onChange={(e) =>
                              handleCellChange(entry._id, "status", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "status")}
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

                        {/* Delete Action */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleDeleteRow(entry._id)}
                            className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
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
        <div className="mt-6 flex gap-3 justify-between flex-wrap">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Row
          </button>

          <div className="flex gap-3">
            {hasNewEntries && (
              <button
                onClick={handleSaveNewEntries}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Save New Entries
              </button>
            )}
            <button
              onClick={handleExportExcel}
              disabled={entries.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> All cells are directly editable. Changes are auto-saved when you move to the next field (except for new entries, which require clicking "Save New Entries").
          </p>
        </div>
      </div>
    </div>
  );
}
