"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Plus, Trash2, Download, Scissors, Layout, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";

type ProductionEntry = {
  _id?: string;
  designNumber: string;
  color: string;
  size: string;
  cutting: number;
  stitching: number;
  finishing: number;
  remarks: string;
};

export default function ProductionTrackingPage() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempValues, setTempValues] = useState<Record<string, Partial<ProductionEntry>>>({});

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/production-tracking");
      if (res.data && (res.data.success || Array.isArray(res.data))) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching production data:", error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    return {
      cutting: entries.reduce((sum, e) => sum + (e.cutting || 0), 0),
      stitching: entries.reduce((sum, e) => sum + (e.stitching || 0), 0),
      finishing: entries.reduce((sum, e) => sum + (e.finishing || 0), 0),
    };
  };

  const handleAddRow = () => {
    const newId = `temp-${Date.now()}`;
    const newEntry: ProductionEntry = {
      _id: newId,
      designNumber: "",
      color: "",
      size: "",
      cutting: 0,
      stitching: 0,
      finishing: 0,
      remarks: "",
    };
    setEntries([...entries, newEntry]);
    setTempValues({
      ...tempValues,
      [newId]: newEntry,
    });
  };

  const handleDeleteRow = async (id: string | undefined) => {
    if (!id) {
      setEntries(entries.filter((e) => e._id !== id));
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this entry?");
    if (!confirmed) return;

    try {
      await api.delete(`/production-tracking/${id}`);
      setEntries(entries.filter((e) => e._id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert("Failed to delete entry");
    }
  };

  const handleCellChange = (
    id: string | undefined,
    field: keyof ProductionEntry,
    value: string
  ) => {
    if (!id) return;

    const numericFields = ["cutting", "stitching", "finishing"];
    const parsedValue = numericFields.includes(field) ? parseInt(value) || 0 : value;

    setTempValues({
      ...tempValues,
      [id]: {
        ...tempValues[id],
        [field]: parsedValue,
      },
    });
  };

  const handleCellBlur = async (id: string | undefined, field: keyof ProductionEntry) => {
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
      await api.put(`/production-tracking/${id}`, {
        [field]: newValue,
      });
    } catch (error) {
      console.error("Error updating entry:", error);
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
      if (!entry.designNumber || !entry.color || !entry.size) {
        alert("Please fill in all required fields (Design Number, Color, Size)");
        return;
      }
    }

    try {
      const savedEntries = await Promise.all(
        newEntries.map((entry) =>
          api.post("/production-tracking", {
            designNumber: entry.designNumber,
            color: entry.color,
            size: entry.size,
            cutting: entry.cutting || 0,
            stitching: entry.stitching || 0,
            finishing: entry.finishing || 0,
            remarks: entry.remarks || "",
          })
        )
      );

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

      setTempValues({});
      alert("Entries saved successfully!");
    } catch (error) {
      console.error("Error saving entries:", error);
      alert("Failed to save entries");
    }
  };

  const handleExportExcel = () => {
    const totals = getTotals();
    const data = entries.map((e) => ({
      "Design Number": e.designNumber,
      Color: e.color,
      Size: e.size,
      Cutting: e.cutting,
      Stitching: e.stitching,
      Finishing: e.finishing,
      Remarks: e.remarks,
    }));

    data.push({
      "Design Number": "",
      Color: "TOTAL",
      Size: "",
      Cutting: totals.cutting,
      Stitching: totals.stitching,
      Finishing: totals.finishing,
      Remarks: "",
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Tracking");
    XLSX.writeFile(wb, "production-tracking.xlsx");
  };

  const totals = getTotals();
  const hasNewEntries = entries.some((e) => e._id?.startsWith("temp-"));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading production data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Production Tracking</h1>
          <p className="text-lg text-gray-600">Monitor quantities across production stages</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total in Cutting</p>
                <p className="text-4xl font-bold text-blue-600">{totals.cutting}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <Scissors className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-purple-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total in Stitching</p>
                <p className="text-4xl font-bold text-purple-600">{totals.stitching}</p>
              </div>
              <div className="bg-purple-100 rounded-lg p-3">
                <Layout className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total in Finishing</p>
                <p className="text-4xl font-bold text-green-600">{totals.finishing}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Design Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Color</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Size</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cutting</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Stitching</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Finishing</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No production entries yet. Click "Add Row" to create one.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const displayValues = {
                      designNumber: tempValues[entry._id || ""]?.designNumber ?? entry.designNumber,
                      color: tempValues[entry._id || ""]?.color ?? entry.color,
                      size: tempValues[entry._id || ""]?.size ?? entry.size,
                      cutting: tempValues[entry._id || ""]?.cutting ?? entry.cutting,
                      stitching: tempValues[entry._id || ""]?.stitching ?? entry.stitching,
                      finishing: tempValues[entry._id || ""]?.finishing ?? entry.finishing,
                      remarks: tempValues[entry._id || ""]?.remarks ?? entry.remarks,
                    };

                    return (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        {/* Design Number */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.designNumber}
                            onChange={(e) =>
                              handleCellChange(entry._id, "designNumber", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "designNumber")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., DSN-001"
                          />
                        </td>

                        {/* Color */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.color}
                            onChange={(e) =>
                              handleCellChange(entry._id, "color", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "color")}
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., M"
                          />
                        </td>

                        {/* Cutting */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={displayValues.cutting}
                            onChange={(e) =>
                              handleCellChange(entry._id, "cutting", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "cutting")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Stitching */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={displayValues.stitching}
                            onChange={(e) =>
                              handleCellChange(entry._id, "stitching", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "stitching")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Finishing */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={displayValues.finishing}
                            onChange={(e) =>
                              handleCellChange(entry._id, "finishing", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "finishing")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Remarks */}
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={displayValues.remarks}
                            onChange={(e) =>
                              handleCellChange(entry._id, "remarks", e.target.value)
                            }
                            onBlur={() => handleCellBlur(entry._id, "remarks")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="Add remarks..."
                          />
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

                {/* Total Row */}
                {entries.length > 0 && (
                  <tr className="bg-blue-50 font-semibold">
                    <td colSpan={3} className="px-6 py-4 text-gray-700">Total</td>
                    <td className="px-6 py-4 text-blue-600">{totals.cutting}</td>
                    <td className="px-6 py-4 text-purple-600">{totals.stitching}</td>
                    <td className="px-6 py-4 text-green-600">{totals.finishing}</td>
                    <td colSpan={2}></td>
                  </tr>
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
