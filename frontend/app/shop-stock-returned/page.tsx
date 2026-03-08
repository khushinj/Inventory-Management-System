"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

type Entry = {
  _id: string;
  dno?: string;
  color?: string;
  size?: string;
  qty: number;
  mrp?: number;
  date?: string;
  formType?: string;
  domain: string;
};

type SampleRow = {
  dno: string;
  type: string;
  color: string;
  mrp: number;
  date: string;
  sizes: {
    [size: string]: number;
  };
  _id?: string;
};

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

const normalizeDesignNumber = (value: string) =>
  value.trim().replace(/\s+/g, "").toUpperCase();

const normalizeColor = (value: string) =>
  value.trim().replace(/\s+/g, " ").toUpperCase();

const normalizeSizeKey = (value: string) => {
  const normalized = value.trim().toUpperCase();
  return normalized === "2XL" ? "XXL" : normalized;
};

const normalizeStockReturnRow = (row: SampleRow): SampleRow => {
  const normalizedSizes: SampleRow["sizes"] = {
    S: 0,
    M: 0,
    L: 0,
    XL: 0,
    XXL: 0,
    "3XL": 0,
    "4XL": 0,
    "5XL": 0,
    "6XL": 0,
  };

  Object.entries(row.sizes || {}).forEach(([size, qty]) => {
    const normalizedSize = normalizeSizeKey(size);
    if (normalizedSize in normalizedSizes) {
      normalizedSizes[normalizedSize] = (normalizedSizes[normalizedSize] || 0) + (Number(qty) || 0);
    }
  });

  return {
    ...row,
    dno: normalizeDesignNumber(row.dno || ""),
    type: (row.type || "").trim(),
    color: normalizeColor(row.color || ""),
    sizes: normalizedSizes,
  };
};

export default function StockReturnedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stockReturnedRows, setStockReturnedRows] = useState<SampleRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [newStockReturnedRow, setNewStockReturnedRow] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    mrp: 0,
    date: new Date().toISOString().split("T")[0],
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      "3XL": 0,
      "4XL": 0,
      "5XL": 0,
      "6XL": 0,
    },
  });
  const [isCreatingStockReturn, setIsCreatingStockReturn] = useState(false);
  const [editingStockReturnRow, setEditingStockReturnRow] = useState<string | null>(null);
  const [editStockReturnForm, setEditStockReturnForm] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    mrp: 0,
    date: new Date().toISOString().split("T")[0],
    sizes: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      "3XL": 0,
      "4XL": 0,
      "5XL": 0,
      "6XL": 0,
    },
  });

  const stockReturnDnoRef = useRef<HTMLInputElement>(null);
  const stockReturnTypeRef = useRef<HTMLInputElement>(null);
  const stockReturnColorRef = useRef<HTMLInputElement>(null);
  const stockReturnMrpRef = useRef<HTMLInputElement>(null);
  const stockReturnDateRef = useRef<HTMLInputElement>(null);
  const stockReturnSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStockReturnEntries();
  }, []);

  const recalculateShopInventory = async () => {
    try {
      await api.post("/shop-inventory/calculate");
    } catch (error) {
      console.error("Error recalculating shop inventory:", error);
    }
  };

  const fetchStockReturnEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock-returned");
      
      if (res.data && Array.isArray(res.data)) {
        setEntries(res.data);
        
        if (res.data.length > 0) {
          convertToGroupedRows(res.data);
        } else {
          setStockReturnedRows([]);
        }
      }
    } catch (error) {
      console.error("Error fetching stock return entries:", error);
      setEntries([]);
      setStockReturnedRows([]);
    } finally {
      setLoading(false);
    }
  };

  const convertToGroupedRows = (allStockReturned: any[]) => {
    const rows: SampleRow[] = allStockReturned.map((entry) => ({
      dno: normalizeDesignNumber(entry.dno || ""),
      type: entry.type || "",
      color: normalizeColor(entry.color || ""),
      mrp: entry.mrp || 0,
      date: entry.date ? new Date(entry.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      sizes: {
        S: entry.items?.find((item: any) => item.size === "S")?.qty || 0,
        M: entry.items?.find((item: any) => item.size === "M")?.qty || 0,
        L: entry.items?.find((item: any) => item.size === "L")?.qty || 0,
        XL: entry.items?.find((item: any) => item.size === "XL")?.qty || 0,
        XXL: entry.items?.find((item: any) => item.size === "XXL")?.qty || 0,
        "3XL": entry.items?.find((item: any) => item.size === "3XL")?.qty || 0,
        "4XL": entry.items?.find((item: any) => item.size === "4XL")?.qty || 0,
        "5XL": entry.items?.find((item: any) => item.size === "5XL")?.qty || 0,
        "6XL": entry.items?.find((item: any) => item.size === "6XL")?.qty || 0,
      },
      _id: entry._id,
    }));
    setStockReturnedRows(rows);
  };

  const handleSaveStockReturnRow = async () => {
    const normalizedRow = normalizeStockReturnRow(newStockReturnedRow);

    if (!normalizedRow.dno || !normalizedRow.color) {
      alert("Please enter DNO and Color");
      return;
    }

    if (Object.values(normalizedRow.sizes).every(size => size === 0)) {
      alert("Please enter at least one size quantity");
      return;
    }

    const tempId = `temp_${Date.now()}`;

    try {
      const rowWithTempId = { ...normalizedRow, _id: tempId };

      // Add new row to local state immediately
      setStockReturnedRows([...stockReturnedRows, rowWithTempId]);

      // Reset form immediately so user can continue entering
      setNewStockReturnedRow({
        dno: "",
        type: "",
        color: "",
        mrp: 0,
        date: new Date().toISOString().split("T")[0],
        sizes: {
          S: 0,
          M: 0,
          L: 0,
          XL: 0,
          XXL: 0,
          "3XL": 0,
          "4XL": 0,
          "5XL": 0,
          "6XL": 0,
        },
      });

      // Keep input row visible for next entry
      stockReturnDnoRef.current?.focus();

      // Save to backend in background
      const totalQty = Object.values(normalizedRow.sizes).reduce((a, b) => a + b, 0);
      
      const dataToSave = {
        dno: normalizedRow.dno,
        type: normalizedRow.type,
        color: normalizedRow.color,
        mrp: normalizedRow.mrp,
        date: normalizedRow.date,
        items: Object.entries(normalizedRow.sizes)
          .filter(([_, qty]) => qty > 0)
          .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: normalizedRow.mrp })),
        totalQuantity: totalQty,
      };

      const res = await api.post("/stock-returned", dataToSave);
      await recalculateShopInventory();
      
      // Update the row with the real ID from backend
      setStockReturnedRows(prevRows =>
        prevRows.map(row =>
          row._id === tempId ? { ...row, _id: res.data._id } : row
        )
      );
    } catch (error) {
      console.error("Error saving stock return row:", error);
      alert("Failed to save stock return entry");
      // Remove the temporary row if save failed
      setStockReturnedRows(prevRows =>
        prevRows.filter(row => row._id !== tempId)
      );
    }
  };

  const handleEditStockReturnRow = (row: SampleRow) => {
    setEditingStockReturnRow(row._id || null);
    setEditStockReturnForm({ ...row });
  };

  const handleUpdateStockReturnRow = async () => {
    const normalizedForm = normalizeStockReturnRow(editStockReturnForm);

    if (!normalizedForm.dno || !normalizedForm.color) {
      alert("Please enter DNO and Color");
      return;
    }

    if (Object.values(normalizedForm.sizes).every(size => size === 0)) {
      alert("Please enter at least one size quantity");
      return;
    }

    try {
      const key = normalizedForm._id;
      
      // Update local state immediately
      setStockReturnedRows(stockReturnedRows.map(row => {
        if (row._id === key) {
          return normalizedForm;
        }
        return row;
      }));

      setEditingStockReturnRow(null);

      // Save to backend in background
      if (key) {
        const totalQty = Object.values(normalizedForm.sizes).reduce((a, b) => a + b, 0);

        const dataToUpdate = {
          dno: normalizedForm.dno,
          type: normalizedForm.type,
          color: normalizedForm.color,
          mrp: normalizedForm.mrp,
          date: normalizedForm.date,
          items: Object.entries(normalizedForm.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: normalizedForm.mrp })),
          totalQuantity: totalQty,
        };

        await api.put(`/stock-returned/${key}`, dataToUpdate);
        await recalculateShopInventory();
      }
    } catch (error) {
      console.error("Error updating stock return row:", error);
      alert("Failed to update stock return entry");
    }
  };

  const handleDeleteStockReturnRow = async (id: string) => {
    if (!confirm("Are you sure you want to delete this stock return entry?")) return;

    try {
      // Remove from local state immediately
      setStockReturnedRows(stockReturnedRows.filter(row => row._id !== id));

      // Delete from backend in background
      if (id) {
        await api.delete(`/stock-returned/${id}`);
        await recalculateShopInventory();
      }
    } catch (error) {
      console.error("Error deleting stock return row:", error);
      alert("Failed to delete stock return entry");
    }
  };

  const handleStockReturnKeyDown = (e: React.KeyboardEvent, field: string, index: number) => {
    if (e.key === "Enter") {
      if (field === "dno") {
        stockReturnTypeRef.current?.focus();
      } else if (field === "type") {
        stockReturnColorRef.current?.focus();
      } else if (field === "color") {
        stockReturnMrpRef.current?.focus();
      } else if (field === "mrp") {
        stockReturnDateRef.current?.focus();
      } else if (field === "date") {
        stockReturnSizeRefs.current["S"]?.focus();
      } else if (field === "size") {
        const sizeIndex = SIZES.indexOf(SIZES[index]);
        if (sizeIndex < SIZES.length - 1) {
          stockReturnSizeRefs.current[SIZES[sizeIndex + 1]]?.focus();
        } else {
          handleSaveStockReturnRow();
        }
      }
    }
  };

  const handleCancelStockReturn = () => {
    setIsCreatingStockReturn(false);
    setNewStockReturnedRow({
      dno: "",
      type: "",
      color: "",
      mrp: 0,
      date: new Date().toISOString().split("T")[0],
      sizes: {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
        "3XL": 0,
        "4XL": 0,
        "5XL": 0,
        "6XL": 0,
      },
    });
  };

  const downloadStockReturnEntries = () => {
    const excelData = stockReturnedRows.flatMap((row) => 
      SIZES.map((size, index) => ({
        "DNO": index === 0 ? row.dno : "",
        "Type": index === 0 ? row.type : "",
        "Color": index === 0 ? row.color : "",
        "MRP": index === 0 ? row.mrp : "",
        "Date": index === 0 ? row.date : "",
        "Size": size,
        "Quantity": row.sizes[size] || 0,
      }))
    );

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Return");

    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 12 },
    ];

    const fileName = `Stock_Returned_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleImportStockReturnEntries = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("📊 Excel data parsed:", jsonData.length, "rows");
      if (jsonData.length > 0) {
        console.log("Sample row:", jsonData[0]);
        console.log("Columns:", Object.keys(jsonData[0] as any));
      }

      const groupedData: SampleRow[] = [];
      let skippedRows = 0;

      // Check if this is wide format (size columns) or long format (Size + Quantity columns)
      const firstRow = jsonData[0] as any;
      const hasWideSizeColumns = jsonData.length > 0 && 
        (firstRow?.hasOwnProperty('S') || firstRow?.hasOwnProperty('s') ||
         firstRow?.hasOwnProperty('M') || firstRow?.hasOwnProperty('m'));

      if (hasWideSizeColumns) {
        console.log("✅ Detected WIDE format (size columns: S, M, L, XL, etc.)");
        
        // Wide format: One row per item with size columns
        jsonData.forEach((row: any, index: number) => {
          const dno = normalizeDesignNumber(
            row.DNO?.toString() || row.dno?.toString() || row.Dno?.toString() || ""
          );
          const type = (
            row.Type?.toString() || row.type?.toString() || row.TYPE?.toString() || ""
          ).trim();
          const color = normalizeColor(
            row.Color?.toString() || row.color?.toString() || row.COLOR?.toString() || ""
          );
          
          // Parse date - handle Excel serial numbers and string dates
          let date = new Date().toISOString().split("T")[0];
          const dateValue = row.Date || row.date || row.DATE;
          if (dateValue) {
            if (typeof dateValue === 'number') {
              // Excel serial date number
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              date = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              // Try parsing as string
              const parsedDate = new Date(dateValue.toString());
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split("T")[0];
              } else {
                date = dateValue.toString().trim();
              }
            }
          }
          
          const mrp = parseFloat(
            row.MRP?.toString() || row.mrp?.toString() || row.Mrp?.toString() || "0"
          ) || 0;

          // Read size quantities from columns
          const sizes: SampleRow["sizes"] = {
            S: parseInt(row.S?.toString() || row.s?.toString() || "0") || 0,
            M: parseInt(row.M?.toString() || row.m?.toString() || "0") || 0,
            L: parseInt(row.L?.toString() || row.l?.toString() || "0") || 0,
            XL: parseInt(row.XL?.toString() || row.xl?.toString() || row.Xl?.toString() || "0") || 0,
            XXL: parseInt(row.XXL?.toString() || row.xxl?.toString() || row.Xxl?.toString() || row["2XL"]?.toString() || "0") || 0,
            "3XL": parseInt(row["3XL"]?.toString() || row["3xl"]?.toString() || "0") || 0,
            "4XL": parseInt(row["4XL"]?.toString() || row["4xl"]?.toString() || "0") || 0,
            "5XL": parseInt(row["5XL"]?.toString() || row["5xl"]?.toString() || "0") || 0,
            "6XL": parseInt(row["6XL"]?.toString() || row["6xl"]?.toString() || "0") || 0,
          };

          const totalQty = Object.values(sizes).reduce((a, b) => a + b, 0);

          console.log(`Row ${index + 1}:`, { dno, type, color, mrp, date, totalQty });

          if (dno && color && totalQty > 0) {
            groupedData.push({
              dno,
              type,
              color,
              date,
              mrp,
              sizes,
            });
          } else {
            skippedRows++;
            console.warn(`⚠️ Skipped row ${index + 1}: missing required fields or no quantities`, { dno, color, totalQty });
          }
        });
      } else {
        console.log("✅ Detected LONG format (Size and Quantity columns)");
        
        // Long format: Multiple rows per item with Size and Quantity columns
        const tempGrouped: { [key: string]: SampleRow } = {};

        jsonData.forEach((row: any, index: number) => {
          const dno = normalizeDesignNumber(
            row.DNO?.toString() || row.dno?.toString() || row.Dno?.toString() || ""
          );
          const type = (
            row.Type?.toString() || row.type?.toString() || row.TYPE?.toString() || ""
          ).trim();
          const color = normalizeColor(
            row.Color?.toString() || row.color?.toString() || row.COLOR?.toString() || ""
          );
          
          // Parse date - handle Excel serial numbers and string dates
          let date = new Date().toISOString().split("T")[0];
          const dateValue = row.Date || row.date || row.DATE;
          if (dateValue) {
            if (typeof dateValue === 'number') {
              // Excel serial date number
              const excelDate = XLSX.SSF.parse_date_code(dateValue);
              date = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
            } else {
              // Try parsing as string
              const parsedDate = new Date(dateValue.toString());
              if (!isNaN(parsedDate.getTime())) {
                date = parsedDate.toISOString().split("T")[0];
              } else {
                date = dateValue.toString().trim();
              }
            }
          }
          
          const size = normalizeSizeKey(
            row.Size?.toString() || row.size?.toString() || row.SIZE?.toString() || ""
          );
          const qty = parseInt(
            row.Quantity?.toString() || row.quantity?.toString() || row.QUANTITY?.toString() || 
            row.Qty?.toString() || row.qty?.toString() || row.QTY?.toString() || "0"
          ) || 0;
          const mrp = parseFloat(
            row.MRP?.toString() || row.mrp?.toString() || row.Mrp?.toString() || "0"
          ) || 0;

          console.log(`Row ${index + 1}:`, { dno, type, color, size, qty, mrp });

          if (dno && color && size && qty > 0) {
            const key = `${dno}_${color}`;
            
            if (!tempGrouped[key]) {
              tempGrouped[key] = {
                dno,
                type,
                color,
                date,
                mrp: mrp,
                sizes: {
                  S: 0,
                  M: 0,
                  L: 0,
                  XL: 0,
                  XXL: 0,
                  "3XL": 0,
                  "4XL": 0,
                  "5XL": 0,
                  "6XL": 0,
                },
              };
            } else {
              if (type && !tempGrouped[key].type) tempGrouped[key].type = type;
              if (mrp > 0) tempGrouped[key].mrp = mrp;
            }

            if (tempGrouped[key].sizes.hasOwnProperty(size)) {
              tempGrouped[key].sizes[size] += qty;
            }
          } else {
            skippedRows++;
            console.warn(`⚠️ Skipped row ${index + 1}: missing required fields`, { dno, color, size, qty });
          }
        });

        groupedData.push(...Object.values(tempGrouped));
      }

      console.log(`✅ Processed ${groupedData.length} entries`);
      console.log(`⚠️ Skipped ${skippedRows} rows`);

      if (groupedData.length === 0) {
        alert(`No valid entries found in Excel file!\n\nRequired columns:\n- Wide format: DNO, Color, and size columns (S, M, L, XL, etc.)\n- Long format: DNO, Color, Size, Quantity\n\nOptional: Type, MRP, Date\n\nSkipped ${skippedRows} rows due to missing data.`);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Save to backend
      for (const row of groupedData) {
        const totalQty = Object.values(row.sizes).reduce((a, b) => a + b, 0);
        
        const dataToSave = {
          dno: row.dno,
          type: row.type,
          color: row.color,
          mrp: row.mrp,
          date: row.date,
          items: Object.entries(row.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size: normalizeSizeKey(size), qty, mrp: row.mrp })),
          totalQuantity: totalQty,
        };

        await api.post("/stock-returned", dataToSave);
      }

      await recalculateShopInventory();

      // Refresh data
      fetchStockReturnEntries();
      alert(`Successfully imported ${groupedData.length} entries!`);
    } catch (error) {
      console.error("Error importing stock return entries:", error);
      alert(`Failed to import stock return entries: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Stock Returned</h1>
          <p className="text-gray-600">Manage returned stock entries with size-wise quantities</p>
        </div>

        {/* Stock Return Entries Table */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Stock Returned Entries</h2>
              <p className="text-sm text-gray-600 mt-1">
                {stockReturnedRows.length} entries
              </p>
            </div>
            <div className="flex gap-3">
              {!isCreatingStockReturn && (
                <button
                  onClick={() => setIsCreatingStockReturn(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  + Add Entry
                </button>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Import from Excel
              </button>
              {stockReturnedRows.length > 0 && (
                <button
                  onClick={downloadStockReturnEntries}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Export to Excel
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleImportStockReturnEntries}
                className="hidden"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading entries...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">DNO</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Color</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">MRP</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    {SIZES.map((size) => (
                      <th
                        key={size}
                        className="px-2 py-4 text-center text-sm font-semibold text-gray-700"
                      >
                        {size}
                      </th>
                    ))}
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isCreatingStockReturn && (
                    <tr className="border-b border-gray-200 bg-blue-50">
                      <td className="px-6 py-4 min-w-[200px]">
                        <input
                          ref={stockReturnDnoRef}
                          type="text"
                          value={newStockReturnedRow.dno}
                          onChange={(e) =>
                            setNewStockReturnedRow({
                              ...newStockReturnedRow,
                              dno: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            handleStockReturnKeyDown(e, "dno", 0)
                          }
                          placeholder="DNO"
                          className="w-full px-3 py-2 border rounded text-black bg-white"
                          autoFocus
                        />
                      </td>
                      <td className="px-6 py-4 min-w-[180px]">
                        <input
                          ref={stockReturnTypeRef}
                          type="text"
                          value={newStockReturnedRow.type}
                          onChange={(e) =>
                            setNewStockReturnedRow({
                              ...newStockReturnedRow,
                              type: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            handleStockReturnKeyDown(e, "type", 0)
                          }
                          placeholder="Type"
                          className="w-full px-3 py-2 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 min-w-[180px]">
                        <input
                          ref={stockReturnColorRef}
                          type="text"
                          value={newStockReturnedRow.color}
                          onChange={(e) =>
                            setNewStockReturnedRow({
                              ...newStockReturnedRow,
                              color: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            handleStockReturnKeyDown(e, "color", 0)
                          }
                          placeholder="Color"
                          className="w-full px-3 py-2 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <input
                          ref={stockReturnMrpRef}
                          type="number"
                          value={newStockReturnedRow.mrp || ""}
                          onChange={(e) =>
                            setNewStockReturnedRow({
                              ...newStockReturnedRow,
                              mrp: parseFloat(e.target.value) || 0,
                            })
                          }
                          onKeyDown={(e) =>
                            handleStockReturnKeyDown(e, "mrp", 0)
                          }
                          placeholder="MRP"
                          className="w-full px-3 py-2 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={stockReturnDateRef}
                          type="date"
                          value={newStockReturnedRow.date}
                          onChange={(e) =>
                            setNewStockReturnedRow({
                              ...newStockReturnedRow,
                              date: e.target.value,
                            })
                          }
                          onKeyDown={(e) =>
                            handleStockReturnKeyDown(e, "date", 0)
                          }
                          className="w-full px-2 py-2 border rounded text-black bg-white"
                        />
                      </td>
                      {SIZES.map((size) => (
                        <td key={size} className="px-2 py-4">
                          <input
                            ref={(el) => {
                              if (el) stockReturnSizeRefs.current[size] = el;
                            }}
                            type="number"
                            value={
                              newStockReturnedRow.sizes[size] || ""
                            }
                            onChange={(e) =>
                              setNewStockReturnedRow({
                                ...newStockReturnedRow,
                                sizes: {
                                  ...newStockReturnedRow.sizes,
                                  [size]:
                                    parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            onKeyDown={(e) =>
                              handleStockReturnKeyDown(
                                e,
                                "size",
                                SIZES.indexOf(size)
                              )
                            }
                            placeholder="0"
                            className="w-16 px-2 py-2 border rounded text-black bg-white text-center"
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={handleSaveStockReturnRow}
                          className="text-green-600 hover:text-green-900 mr-3 font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelStockReturn}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}
                  {stockReturnedRows.length === 0 && !isCreatingStockReturn ? (
                    <tr>
                      <td
                        colSpan={SIZES.length + 5}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No stock returned entries. Click "Add Entry" to create one.
                      </td>
                    </tr>
                  ) : (
                    stockReturnedRows.map((row) => {
                      const key = row._id || "";
                      const isEditing = editingStockReturnRow === key;

                      return (
                        <tr key={key} className="border-b border-gray-100 hover:bg-gray-50">
                          {isEditing ? (
                            <>
                              <td className="px-6 py-4 min-w-[200px]">
                                <input
                                  type="text"
                                  value={editStockReturnForm.dno}
                                  onChange={(e) =>
                                    setEditStockReturnForm({
                                      ...editStockReturnForm,
                                      dno: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded text-black bg-white"
                                />
                              </td>
                              <td className="px-6 py-4 min-w-[180px]">
                                <input
                                  type="text"
                                  value={editStockReturnForm.type}
                                  onChange={(e) =>
                                    setEditStockReturnForm({
                                      ...editStockReturnForm,
                                      type: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded text-black bg-white"
                                />
                              </td>
                              <td className="px-6 py-4 min-w-[180px]">
                                <input
                                  type="text"
                                  value={editStockReturnForm.color}
                                  onChange={(e) =>
                                    setEditStockReturnForm({
                                      ...editStockReturnForm,
                                      color: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded text-black bg-white"
                                />
                              </td>
                              <td className="px-6 py-4 min-w-[120px]">
                                <input
                                  type="number"
                                  value={editStockReturnForm.mrp || ""}
                                  onChange={(e) =>
                                    setEditStockReturnForm({
                                      ...editStockReturnForm,
                                      mrp: parseFloat(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full px-3 py-2 border rounded text-black bg-white"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="date"
                                  value={editStockReturnForm.date}
                                  onChange={(e) =>
                                    setEditStockReturnForm({
                                      ...editStockReturnForm,
                                      date: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-2 border rounded text-black bg-white"
                                />
                              </td>
                              {SIZES.map((size) => (
                                <td key={size} className="px-2 py-4">
                                  <input
                                    type="number"
                                    value={
                                      editStockReturnForm.sizes[size] || ""
                                    }
                                    onChange={(e) =>
                                      setEditStockReturnForm({
                                        ...editStockReturnForm,
                                        sizes: {
                                          ...editStockReturnForm.sizes,
                                          [size]:
                                            parseInt(e.target.value) || 0,
                                        },
                                      })
                                    }
                                    className="w-16 px-2 py-2 border rounded text-black bg-white text-center"
                                  />
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={handleUpdateStockReturnRow}
                                  className="text-green-600 hover:text-green-900 mr-3 font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() =>
                                    setEditingStockReturnRow(null)
                                  }
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {row.dno}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.color}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.mrp || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.date}
                              </td>
                              {SIZES.map((size) => (
                                <td
                                  key={size}
                                  className="px-2 py-4 text-center whitespace-nowrap text-sm text-gray-900"
                                >
                                  {row.sizes[size] || "-"}
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() =>
                                    handleEditStockReturnRow(row)
                                  }
                                  className="text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteStockReturnRow(
                                      row._id || ""
                                    )
                                  }
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
