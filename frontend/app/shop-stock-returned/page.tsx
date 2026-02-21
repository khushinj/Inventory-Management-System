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
  date: string;
  sizes: {
    [size: string]: number;
  };
  _id?: string;
};

const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

export default function StockReturnedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [stockReturnedRows, setStockReturnedRows] = useState<SampleRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [newStockReturnedRow, setNewStockReturnedRow] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
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
  const stockReturnDateRef = useRef<HTMLInputElement>(null);
  const stockReturnSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStockReturnEntries();
  }, []);

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
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
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
    if (!newStockReturnedRow.dno.trim() || !newStockReturnedRow.color.trim()) {
      alert("Please enter DNO and Color");
      return;
    }

    if (Object.values(newStockReturnedRow.sizes).every(size => size === 0)) {
      alert("Please enter at least one size quantity");
      return;
    }

    try {
      // Create temporary ID for immediate display
      const tempId = `temp_${Date.now()}`;
      const rowWithTempId = { ...newStockReturnedRow, _id: tempId };

      // Add new row to local state immediately
      setStockReturnedRows([...stockReturnedRows, rowWithTempId]);

      // Reset form immediately so user can continue entering
      setNewStockReturnedRow({
        dno: "",
        type: "",
        color: "",
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
      const totalQty = Object.values(newStockReturnedRow.sizes).reduce((a, b) => a + b, 0);
      
      const dataToSave = {
        dno: newStockReturnedRow.dno,
        type: newStockReturnedRow.type,
        color: newStockReturnedRow.color,
        date: newStockReturnedRow.date,
        items: Object.entries(newStockReturnedRow.sizes)
          .filter(([_, qty]) => qty > 0)
          .map(([size, qty]) => ({ size, qty })),
        totalQuantity: totalQty,
      };

      const res = await api.post("/stock-returned", dataToSave);
      
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
        prevRows.filter(row => row._id !== `temp_${Date.now()}`)
      );
    }
  };

  const handleEditStockReturnRow = (row: SampleRow) => {
    setEditingStockReturnRow(`${row.dno}_${row.color}`);
    setEditStockReturnForm({ ...row });
  };

  const handleUpdateStockReturnRow = async () => {
    try {
      const key = `${editStockReturnForm.dno}_${editStockReturnForm.color}`;
      
      // Update local state immediately
      setStockReturnedRows(stockReturnedRows.map(row => {
        if (`${row.dno}_${row.color}` === key) {
          return editStockReturnForm;
        }
        return row;
      }));

      setEditingStockReturnRow(null);

      // Save to backend in background
      const rowToUpdate = stockReturnedRows.find(
        row => row.dno === editStockReturnForm.dno && row.color === editStockReturnForm.color
      );

      if (rowToUpdate && rowToUpdate._id) {
        const totalQty = Object.values(editStockReturnForm.sizes).reduce((a, b) => a + b, 0);

        const dataToUpdate = {
          dno: editStockReturnForm.dno,
          type: editStockReturnForm.type,
          color: editStockReturnForm.color,
          date: editStockReturnForm.date,
          items: Object.entries(editStockReturnForm.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size, qty })),
          totalQuantity: totalQty,
        };

        await api.put(`/stock-returned/${rowToUpdate._id}`, dataToUpdate);
      }
    } catch (error) {
      console.error("Error updating stock return row:", error);
      alert("Failed to update stock return entry");
    }
  };

  const handleDeleteStockReturnRow = async (dno: string, color: string) => {
    if (!confirm("Are you sure you want to delete this stock return entry?")) return;

    try {
      // Remove from local state immediately
      setStockReturnedRows(stockReturnedRows.filter(row => !(row.dno === dno && row.color === color)));

      // Delete from backend in background
      const rowToDelete = stockReturnedRows.find(
        row => row.dno === dno && row.color === color
      );

      if (rowToDelete && rowToDelete._id) {
        await api.delete(`/stock-returned/${rowToDelete._id}`);
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

      // Group data by DNO and Color
      const groupedData: { [key: string]: SampleRow } = {};

      jsonData.forEach((row: any) => {
        const dno = row.DNO?.toString().trim();
        const type = row.Type?.toString().trim() || "";
        const color = row.Color?.toString().trim();
        const date = row.Date?.toString().trim() || new Date().toISOString().split("T")[0];
        const size = row.Size?.toString().trim().toUpperCase();
        const qty = parseInt(row.Quantity) || 0;

        if (dno && color && size && qty > 0) {
          const key = `${dno}_${color}`;
          
          if (!groupedData[key]) {
            groupedData[key] = {
              dno,
              type,
              color,
              date,
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
          }

          if (groupedData[key].sizes.hasOwnProperty(size)) {
            groupedData[key].sizes[size] = qty;
          }
        }
      });

      // Save to backend
      for (const row of Object.values(groupedData)) {
        const totalQty = Object.values(row.sizes).reduce((a, b) => a + b, 0);
        
        const dataToSave = {
          dno: row.dno,
          color: row.color,
          date: row.date,
          items: Object.entries(row.sizes)
            .filter(([_, qty]) => qty > 0)
            .map(([size, qty]) => ({ size, qty })),
          totalQuantity: totalQty,
        };

        await api.post("/stock-returned", dataToSave);
      }

      // Refresh data
      fetchStockReturnEntries();
      alert(`Successfully imported ${Object.keys(groupedData).length} entries!`);
    } catch (error) {
      console.error("Error importing stock return entries:", error);
      alert("Failed to import stock return entries");
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
                      const key = `${row.dno}_${row.color}`;
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
                                      row.dno,
                                      row.color
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
