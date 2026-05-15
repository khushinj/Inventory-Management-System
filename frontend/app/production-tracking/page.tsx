"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Plus, Trash2, Download, Scissors, Layout, CheckCircle2, Check } from "lucide-react";
import * as XLSX from "xlsx";

const UNSAVED_WARNING_MESSAGE = "Your entries will be lost if you go back without saving it.";
const SAMPLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

const createEmptySizes = () =>
  SAMPLE_SIZES.reduce((accumulator, size) => {
    accumulator[size] = 0;
    return accumulator;
  }, {} as Record<string, number>);

const normalizeSizes = (entry: Partial<ProductionEntry>) => {
  const normalizedSizes = createEmptySizes();
  const incomingSizes = entry.sizes && typeof entry.sizes === "object" ? entry.sizes : null;

  if (incomingSizes) {
    for (const [rawSize, quantity] of Object.entries(incomingSizes)) {
      const normalizedSize = String(rawSize).trim().toUpperCase();
      if (SAMPLE_SIZES.includes(normalizedSize)) {
        normalizedSizes[normalizedSize] = Number(quantity) || 0;
      }
    }

    return normalizedSizes;
  }

  const legacySize = String(entry.size || "").trim().toUpperCase();
  if (legacySize) {
    const normalizedSize = legacySize === "2XL" ? "XXL" : legacySize;
    if (SAMPLE_SIZES.includes(normalizedSize)) {
      normalizedSizes[normalizedSize] = 1;
    }
  }

  return normalizedSizes;
};

const summarizeSizes = (sizes: Record<string, number>) =>
  SAMPLE_SIZES.filter((size) => Number(sizes[size]) > 0).join(", ");

type ProductionEntry = {
  _id?: string;
  designNumber: string;
  color: string;
  size?: string;
  sizes?: Record<string, number>;
  cutting: number;
  cuttingDate?: string;
  stitching: number;
  stitchingDate?: string;
  finishing: number;
  finishingDate?: string;
  remarks: string;
};

export default function ProductionTrackingPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempValues, setTempValues] = useState<Record<string, Partial<ProductionEntry>>>({});
  const [transferEntry, setTransferEntry] = useState<ProductionEntry | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const allowNextPopRef = useRef(false);
  const [searchDesignNumber, setSearchDesignNumber] = useState("");

  const formatDateInput = (value: string | undefined) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const normalizeProductionEntry = (entry: ProductionEntry): ProductionEntry => {
    const sizes = normalizeSizes(entry);

    return {
      ...entry,
      size: entry.size || summarizeSizes(sizes),
      sizes,
      cuttingDate: formatDateInput(entry.cuttingDate),
      stitchingDate: formatDateInput(entry.stitchingDate),
      finishingDate: formatDateInput(entry.finishingDate),
    };
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key !== "Enter") {
      return;
    }

    e.preventDefault();

    const table = e.currentTarget.closest("table");
    if (!table) {
      return;
    }

    const fields = Array.from(
      table.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input:not([type="checkbox"]):not([disabled]):not([readonly]), select:not([disabled])'
      )
    );

    const currentIndex = fields.indexOf(e.currentTarget);
    if (currentIndex > -1 && currentIndex < fields.length - 1) {
      fields[currentIndex + 1]?.focus();
    }
  }, []);

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/production-tracking");
      if (res.data && (res.data.success || Array.isArray(res.data))) {
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setEntries(data.map((entry: ProductionEntry) => normalizeProductionEntry(entry)));
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
    const today = formatDateInput(new Date().toISOString());
    const newEntry: ProductionEntry = {
      _id: newId,
      designNumber: "",
      color: "",
      size: "",
      sizes: createEmptySizes(),
      cutting: 0,
      cuttingDate: today,
      stitching: 0,
      stitchingDate: today,
      finishing: 0,
      finishingDate: today,
      remarks: "",
    };
    setEntries((prevEntries) => [newEntry, ...prevEntries]);
    setTempValues({
      ...tempValues,
      [newId]: newEntry,
    });
  };

  const handleDeleteRow = async (id: string | undefined) => {
    if (!id || id.startsWith("temp-")) {
      setEntries((prevEntries) => prevEntries.filter((entry) => entry._id !== id));
      if (id) {
        setTempValues((prevValues) => {
          const nextValues = { ...prevValues };
          delete nextValues[id];
          return nextValues;
        });
      }
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
    const currentEntry = entries.find((entry) => entry._id === id);
    const previousValue = currentEntry?.[field];

    setTempValues((prevValues) => ({
      ...prevValues,
      [id]: {
        ...prevValues[id],
        [field]: parsedValue,
      },
    }));

    if (id.startsWith("temp-")) {
      return;
    }

    setEntries((prevEntries) =>
      prevEntries.map((entry) => (entry._id === id ? { ...entry, [field]: parsedValue as any } : entry))
    );

    void api
      .put(`/production-tracking/${id}`, {
        [field]: parsedValue,
      })
      .catch((error) => {
        console.error("Error updating entry:", error);
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry._id === id ? { ...entry, [field]: previousValue as any } : entry
          )
        );
        setTempValues((prevValues) => ({
          ...prevValues,
          [id]: {
            ...prevValues[id],
            [field]: previousValue as any,
          },
        }));
        alert("Failed to update entry");
      });
  };

  const handleSizeChange = (id: string | undefined, sizeKey: string, value: string) => {
    if (!id) return;

    const parsedValue = parseInt(value) || 0;
    const currentEntry = entries.find((entry) => entry._id === id);
    const previousSizes =
      normalizeSizes({
        ...currentEntry,
        sizes: tempValues[id]?.sizes || currentEntry?.sizes,
        size: tempValues[id]?.size || currentEntry?.size,
      });
    const nextSizes = {
      ...previousSizes,
      [sizeKey]: parsedValue,
    };

    const sizeSummary = summarizeSizes(nextSizes);

    setTempValues((prevValues) => ({
      ...prevValues,
      [id]: {
        ...prevValues[id],
        sizes: nextSizes,
        size: sizeSummary,
      },
    }));

    if (id.startsWith("temp-")) {
      return;
    }

    setEntries((prevEntries) =>
      prevEntries.map((entry) =>
        entry._id === id
          ? {
              ...entry,
              sizes: nextSizes,
              size: sizeSummary,
            }
          : entry
      )
    );

    void api
      .put(`/production-tracking/${id}`, {
        sizes: nextSizes,
        size: sizeSummary,
      })
      .catch((error) => {
        console.error("Error updating size entry:", error);
        setEntries((prevEntries) =>
          prevEntries.map((entry) =>
            entry._id === id
              ? {
                  ...entry,
                  sizes: previousSizes,
                  size: summarizeSizes(previousSizes),
                }
              : entry
          )
        );
        setTempValues((prevValues) => ({
          ...prevValues,
          [id]: {
            ...prevValues[id],
            sizes: previousSizes,
            size: summarizeSizes(previousSizes),
          },
        }));
        alert("Failed to update size entry");
      });
  };

  const handleCellBlur = async (id: string | undefined, field: keyof ProductionEntry) => {
    if (!id) return;

    if (id.startsWith("temp-")) {
      return;
    }
  };

  const handleSaveNewEntries = async () => {
    const newEntries = entries
      .filter((e) => e._id?.startsWith("temp-"))
      .map((entry) => {
        const entryId = entry._id || "";
        const draft = tempValues[entryId] || {};
        const sizes = normalizeSizes({ ...entry, ...draft });
        const sizeSummary = summarizeSizes(sizes);

        return {
          ...entry,
          ...draft,
          designNumber: String(draft.designNumber ?? entry.designNumber ?? "").trim(),
          color: String(draft.color ?? entry.color ?? "").trim(),
          size: sizeSummary,
          sizes,
          cutting: Number(draft.cutting ?? entry.cutting ?? 0) || 0,
            cuttingDate: String(draft.cuttingDate ?? entry.cuttingDate ?? formatDateInput(new Date().toISOString())).trim(),
          stitching: Number(draft.stitching ?? entry.stitching ?? 0) || 0,
            stitchingDate: String(draft.stitchingDate ?? entry.stitchingDate ?? formatDateInput(new Date().toISOString())).trim(),
          finishing: Number(draft.finishing ?? entry.finishing ?? 0) || 0,
            finishingDate: String(draft.finishingDate ?? entry.finishingDate ?? formatDateInput(new Date().toISOString())).trim(),
          remarks: String(draft.remarks ?? entry.remarks ?? "").trim(),
        };
      });
    
    if (newEntries.length === 0) {
      alert("No new entries to save");
      return;
    }

    // Validate entries
    for (const entry of newEntries) {
      if (!entry.designNumber || !entry.color) {
        alert("Please fill in all required fields (Design Number, Color)");
        return;
      }

      if (Object.values(entry.sizes || {}).every((qty) => Number(qty) <= 0)) {
        alert("Please enter at least one size quantity");
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
            sizes: entry.sizes,
            cutting: entry.cutting || 0,
            cuttingDate: entry.cuttingDate || formatDateInput(new Date().toISOString()),
            stitching: entry.stitching || 0,
            stitchingDate: entry.stitchingDate || formatDateInput(new Date().toISOString()),
            finishing: entry.finishing || 0,
            finishingDate: entry.finishingDate || formatDateInput(new Date().toISOString()),
            remarks: entry.remarks || "",
          })
        )
      );

      const savedRows = savedEntries.map((response) =>
        normalizeProductionEntry(response.data?.data || response.data)
      );

      setEntries(
        entries.map((e) => {
          if (e._id?.startsWith("temp-")) {
            const savedIndex = newEntries.findIndex((ne) => ne._id === e._id);
            if (savedIndex >= 0 && savedRows[savedIndex]) {
              return savedRows[savedIndex];
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
    const sizeTotals = SAMPLE_SIZES.reduce(
      (accumulator, size) => {
        accumulator[size] = entries.reduce(
          (sum, entry) => sum + Number(normalizeSizes(entry)[size] || 0),
          0
        );
        return accumulator;
      },
      {} as Record<string, number>
    );

    const data = entries.map((e) => ({
      "Design Number": e.designNumber,
      Color: e.color,
      Size: e.size || summarizeSizes(normalizeSizes(e)),
      ...Object.fromEntries(
        SAMPLE_SIZES.map((size) => [`${size} Qty`, Number(normalizeSizes(e)[size] || 0)])
      ),
      Cutting: e.cutting,
      "Cutting Date": e.cuttingDate ? e.cuttingDate : "",
      Stitching: e.stitching,
      "Stitching Date": e.stitchingDate ? e.stitchingDate : "",
      Finishing: e.finishing,
      "Finishing Date": e.finishingDate ? e.finishingDate : "",
      Remarks: e.remarks,
    }));

    data.push({
      "Design Number": "",
      Color: "TOTAL",
      Size: "",
      ...Object.fromEntries(SAMPLE_SIZES.map((size) => [`${size} Qty`, sizeTotals[size] || 0])),
      Cutting: totals.cutting,
      "Cutting Date": "",
      Stitching: totals.stitching,
      "Stitching Date": "",
      Finishing: totals.finishing,
      "Finishing Date": "",
      Remarks: "",
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Production Tracking");
    XLSX.writeFile(wb, "production-tracking.xlsx");
  };

  const openTransferPopup = (entry: ProductionEntry) => {
    if (!entry._id || entry._id.startsWith("temp-")) {
      alert("Please save this row first before transferring.");
      return;
    }

    const latestFinishing = Number(tempValues[entry._id]?.finishing ?? entry.finishing ?? 0);
    if (latestFinishing <= 0) {
      alert("Only entries with finishing quantity greater than 0 can be transferred.");
      return;
    }

    setTransferEntry(entry);
  };

  const closeTransferPopup = () => {
    if (isTransferring) {
      return;
    }
    setTransferEntry(null);
  };

  const confirmTransferToPresentStock = async () => {
    if (!transferEntry?._id) {
      return;
    }

    try {
      setIsTransferring(true);
      await api.post(`/present-stock/transfer/${transferEntry._id}`);
      // alert("Item transferred to present stock with default status Packed.");
      setTransferEntry(null);
    } catch (error: any) {
      console.error("Error transferring entry to present stock:", error);
      const message = error?.response?.data?.error || "Failed to transfer item";
      alert(message);
    } finally {
      setIsTransferring(false);
    }
  };

  const totals = getTotals();
  const hasNewEntries = entries.some((e) => e._id?.startsWith("temp-"));
  const filteredEntries = entries.filter((entry) =>
    entry.designNumber.toLowerCase().includes(searchDesignNumber.trim().toLowerCase())
  );
  const filteredTotals = {
    cutting: filteredEntries.reduce((sum, e) => sum + (e.cutting || 0), 0),
    stitching: filteredEntries.reduce((sum, e) => sum + (e.stitching || 0), 0),
    finishing: filteredEntries.reduce((sum, e) => sum + (e.finishing || 0), 0),
  };

  useEffect(() => {
    if (!hasNewEntries) {
      return;
    }

    const handlePopState = () => {
      if (allowNextPopRef.current) {
        allowNextPopRef.current = false;
        return;
      }

      setPendingNavigation("__BACK__");
      setShowUnsavedModal(true);
      window.history.pushState(null, "", window.location.href);
    };

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const resolvedUrl = new URL(href, window.location.href);
      if (resolvedUrl.origin !== window.location.origin) return;

      const nextPath = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (nextPath === currentPath) return;

      event.preventDefault();
      setPendingNavigation(nextPath);
      setShowUnsavedModal(true);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [hasNewEntries]);

  const handleStayOnPage = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  const handleLeaveAnyway = () => {
    const destination = pendingNavigation;
    setShowUnsavedModal(false);
    setPendingNavigation(null);

    if (!destination) {
      return;
    }

    if (destination === "__BACK__") {
      allowNextPopRef.current = true;
      window.history.back();
      return;
    }

    router.push(destination);
  };

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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Production</h1>
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

        {/* Actions */}
        <div className="mb-6 flex gap-3 justify-between flex-wrap">
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

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="border-b border-gray-200 p-4 text-black">
            <input
              type="text"
              value={searchDesignNumber}
              onChange={(e) => setSearchDesignNumber(e.target.value)}
              placeholder="Search by Design Number"
              className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[2200px] w-full table-auto">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="min-w-[12rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Design Number</th>
                  <th className="min-w-[10rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Color</th>
                  <th className="min-w-[48rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Sizes</th>
                  <th className="min-w-[8rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Cutting</th>
                  <th className="min-w-[12rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Cutting Date</th>
                  <th className="min-w-[8rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Stitching</th>
                  <th className="min-w-[12rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Stitching Date</th>
                  <th className="min-w-[8rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Finishing</th>
                  <th className="min-w-[12rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Finishing Date</th>
                  <th className="min-w-[12rem] px-6 py-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                  <th className="min-w-[8rem] px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      {entries.length === 0
                        ? "No production entries yet. Click \"Add Row\" to create one."
                        : "No matching design number found."}
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const displayValues = {
                      designNumber: tempValues[entry._id || ""]?.designNumber ?? entry.designNumber,
                      color: tempValues[entry._id || ""]?.color ?? entry.color,
                      size: tempValues[entry._id || ""]?.size ?? entry.size,
                      sizes: SAMPLE_SIZES.reduce((accumulator, size) => {
                        accumulator[size] = Number(
                          tempValues[entry._id || ""]?.sizes?.[size] ?? entry.sizes?.[size] ?? 0
                        );
                        return accumulator;
                      }, createEmptySizes()),
                      cutting: tempValues[entry._id || ""]?.cutting ?? entry.cutting,
                      cuttingDate: tempValues[entry._id || ""]?.cuttingDate ?? entry.cuttingDate,
                      stitching: tempValues[entry._id || ""]?.stitching ?? entry.stitching,
                      stitchingDate: tempValues[entry._id || ""]?.stitchingDate ?? entry.stitchingDate,
                      finishing: tempValues[entry._id || ""]?.finishing ?? entry.finishing,
                      finishingDate: tempValues[entry._id || ""]?.finishingDate ?? entry.finishingDate,
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
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "designNumber")}
                            className="w-full min-w-[11rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "color")}
                            className="w-full min-w-[10rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="e.g., Red"
                          />
                        </td>

                        {/* Sizes */}
                        <td className="px-6 py-4 align-top">
                          <div className="grid grid-cols-3 gap-4 xl:grid-cols-9">
                            {SAMPLE_SIZES.map((sizeOption) => (
                              <div
                                key={sizeOption}
                                className="min-h-[7rem] min-w-[5.75rem] rounded-xl bg-white p-3"
                              >
                                <div className="mb-2 text-center text-sm font-medium tracking-wide text-gray-700">
                                  {sizeOption}
                                </div>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={displayValues.sizes[sizeOption] || ""}
                                  onChange={(e) => handleSizeChange(entry._id, sizeOption, e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-center text-base font-normal text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0"
                                  aria-label={`${sizeOption} quantity`}
                                />
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Cutting */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={displayValues.cutting}
                            onChange={(e) =>
                              handleCellChange(entry._id, "cutting", e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "cutting")}
                            className="w-full min-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Cutting Date */}
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={displayValues.cuttingDate || ""}
                            onChange={(e) =>
                              handleCellChange(entry._id, "cuttingDate" as keyof ProductionEntry, e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "cuttingDate" as keyof ProductionEntry)}
                            className="w-full min-w-[12rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "stitching")}
                            className="w-full min-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Stitching Date */}
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={displayValues.stitchingDate || ""}
                            onChange={(e) =>
                              handleCellChange(entry._id, "stitchingDate" as keyof ProductionEntry, e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "stitchingDate" as keyof ProductionEntry)}
                            className="w-full min-w-[12rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "finishing")}
                            className="w-full min-w-[8rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="0"
                          />
                        </td>

                        {/* Finishing Date */}
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={displayValues.finishingDate || ""}
                            onChange={(e) =>
                              handleCellChange(entry._id, "finishingDate" as keyof ProductionEntry, e.target.value)
                            }
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "finishingDate" as keyof ProductionEntry)}
                            className="w-full min-w-[12rem] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleCellBlur(entry._id, "remarks")}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="Add remarks..."
                          />
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => openTransferPopup(entry)}
                              className="inline-flex items-center justify-center p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Transfer to Present Stock"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRow(entry._id)}
                              className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}

                {/* Total Row */}
                {filteredEntries.length > 0 && (
                  <tr className="bg-blue-50 font-semibold">
                    <td colSpan={3} className="px-6 py-4 text-gray-700">Total</td>
                    <td className="px-6 py-4 text-blue-600">{filteredTotals.cutting}</td>
                    <td></td>
                    <td className="px-6 py-4 text-purple-600">{filteredTotals.stitching}</td>
                    <td></td>
                    <td className="px-6 py-4 text-green-600">{filteredTotals.finishing}</td>
                    <td></td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Info:</strong> All cells are directly editable. Changes are auto-saved when you move to the next field (except for new entries, which require clicking "Save New Entries").
          </p>
        </div>

        {transferEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Transfer</h2>
              <p className="mt-3 text-gray-700">
                This design number's production is done and it will be transferred to present stock
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeTransferPopup}
                  disabled={isTransferring}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  No
                </button>
                <button
                  onClick={confirmTransferToPresentStock}
                  disabled={isTransferring}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isTransferring ? "Transferring..." : "Yes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showUnsavedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-xl font-semibold text-gray-900">Unsaved Entries</h2>
              <p className="mt-3 text-gray-700">{UNSAVED_WARNING_MESSAGE}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={handleStayOnPage}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Stay
                </button>
                <button
                  onClick={handleLeaveAnyway}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
