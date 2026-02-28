"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../lib/api";
import * as XLSX from "xlsx";

type Entry = {
  _id: string;
  dno?: string;
  type?: string;
  color?: string;
  size?: string;
  qty: number;
  date?: string;
  channel?: string;
  formType?: string;
  domain: string;
};

type SampleRow = {
  dno: string;
  type: string;
  color: string;
  date?: string;
  sizes: {
    [size: string]: number;
  };
};

function ShopDashboard() {
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState("All Channels");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState<"import" | "sales" | "return">("import");
  const [lockedFormType, setLockedFormType] = useState<"import" | "sales" | "return" | null>(null);
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: "",
    channel: "",
  });

  const dnoRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<HTMLSelectElement>(null);

  // Refs for import and return forms with horizontal size columns
  const importDnoRef = useRef<HTMLInputElement>(null);
  const importTypeRef = useRef<HTMLInputElement>(null);
  const importColorRef = useRef<HTMLInputElement>(null);
  const importSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const returnDnoRef = useRef<HTMLInputElement>(null);
  const returnTypeRef = useRef<HTMLInputElement>(null);
  const returnColorRef = useRef<HTMLInputElement>(null);
  const returnSizeRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // State for import and return forms with horizontal size columns
  const [importRows, setImportRows] = useState<SampleRow[]>([]);
  const [returnRows, setReturnRows] = useState<SampleRow[]>([]);
  const [isCreatingImport, setIsCreatingImport] = useState(false);
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);
  const [editingImportRow, setEditingImportRow] = useState<string | null>(null);
  const [editingReturnRow, setEditingReturnRow] = useState<string | null>(null);
  const [newImportRow, setNewImportRow] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    sizes: {}
  });
  const [newReturnRow, setNewReturnRow] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    sizes: {}
  });
  const [editImportForm, setEditImportForm] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    sizes: {}
  });
  const [editReturnForm, setEditReturnForm] = useState<SampleRow>({
    dno: "",
    type: "",
    color: "",
    sizes: {}
  });
  const SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "6XL"];

  useEffect(() => {
    const formType = searchParams.get("formType") as "import" | "sales" | "return" | null;
    if (formType && ["import", "sales", "return"].includes(formType)) {
      setSelectedFormType(formType);
      setLockedFormType(formType);
    }
    fetchEntries();
  }, [searchParams]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const shopRes = await api.get("/shop");
      setEntries(shopRes.data);
      groupImportEntries(shopRes.data);
      groupReturnEntries(shopRes.data);
    } catch (err: unknown) {
      console.error("Error fetching entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupImportEntries = (allEntries: Entry[]) => {
    const importEntries = allEntries.filter(entry => entry.formType === "import");
    setImportRows(buildGroupedRows(importEntries));
  };

  const groupReturnEntries = (allEntries: Entry[]) => {
    const returnEntries = allEntries.filter(entry => entry.formType === "return");
    setReturnRows(buildGroupedRows(returnEntries));
  };

  const buildGroupedRows = (items: Entry[]) => {
    const grouped: { [key: string]: SampleRow } = {};

    items.forEach((entry) => {
      if (entry.dno && entry.color && entry.size) {
        const key = `${entry.dno}_${entry.color}`;
        if (!grouped[key]) {
          grouped[key] = {
            dno: entry.dno,
            type: entry.type || "",
            color: entry.color,
            date: entry.date,
            sizes: {},
          };
        }

        // Normalize 2xl to XXL
        const normalizedSize = entry.size.toLowerCase() === '2xl' ? 'XXL' : entry.size;
        // SUM quantities if duplicate entries exist (don't overwrite)
        grouped[key].sizes[normalizedSize] = (grouped[key].sizes[normalizedSize] || 0) + (entry.qty || 0);

        if (entry.date) {
          const currentDate = grouped[key].date;
          if (!currentDate || new Date(entry.date).getTime() > new Date(currentDate).getTime()) {
            grouped[key].date = entry.date;
          }
        }
      }
    });

    return Object.values(grouped);
  };

  const filteredEntries = entries
    .filter((entry) => {
      const matchesSearch =
        entry.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.color?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesChannel =
        filterChannel === "All Channels" || entry.channel === filterChannel;

      const matchesFormType =
        entry.formType === selectedFormType;

      return matchesSearch && matchesChannel && matchesFormType;
    });

  const limitedEntries = filteredEntries.slice(0, 30);
  const filteredGroupedRows = buildGroupedRows(filteredEntries);

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
      size: entry.size || "",
      qty: entry.qty?.toString() || "",
      date: entry.date?.split("T")[0] || "",
      channel: entry.channel || "",
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.patch(`/shop/${id}`, {
        ...editForm,
        formType: selectedFormType,
      });
      setEditingEntry(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating entry:", err);
      alert("Failed to update entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/shop/${id}`);
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting entry:", err);
        alert("Failed to delete entry");
      }
    }
  };

  const handleCreate = () => {
    if (selectedFormType === "import") {
      setIsCreatingImport(true);
      setTimeout(() => importDnoRef.current?.focus(), 100);
    } else if (selectedFormType === "return") {
      setIsCreatingReturn(true);
      setTimeout(() => returnDnoRef.current?.focus(), 100);
    } else {
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        date: new Date().toISOString().split("T")[0],
        channel: "retail",
      });
      setIsCreating(true);
    }
  };

  const handleSaveNew = async () => {
    try {
      await api.post("/shop", {
        ...editForm,
        formType: selectedFormType,
      });
      setIsCreating(false);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error creating entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create entry: " + (axiosError || errorMsg));
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingEntry(null);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    nextRef?: React.RefObject<HTMLInputElement | HTMLSelectElement | null>
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  };

  const handleSaveAndContinue = async (entryId?: string) => {
    try {
      if (entryId) {
        // Update existing entry
        await api.patch(`/shop/${entryId}`, {
          ...editForm,
          formType: selectedFormType,
        });
        setEditingEntry(null);
      } else {
        // Create new entry
        await api.post("/shop", {
          ...editForm,
          formType: selectedFormType,
        });
      }

      // Reset form and prepare for next entry
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        date: new Date().toISOString().split("T")[0],
        channel: "retail",
      });
      setIsCreating(true);
      fetchEntries();

      // Focus first field for next entry
      setTimeout(() => dnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error saving entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to save entry: " + (axiosError || errorMsg));
    }
  };

  // Import form handlers with horizontal size columns
  const handleImportKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        importTypeRef.current?.focus();
      } else if (currentField === 'type') {
        importColorRef.current?.focus();
      } else if (currentField === 'color') {
        importSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SIZES.indexOf(size);
        if (currentIndex < SIZES.length - 1) {
          const nextSize = SIZES[currentIndex + 1];
          importSizeRefs.current[nextSize]?.focus();
        } else {
          handleSaveImportRow();
        }
      }
    }
  };

  const handleSaveImportRow = async () => {
    try {
      const promises = SIZES.map(size => {
        const qty = newImportRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/shop", {
            dno: newImportRow.dno,
            type: newImportRow.type,
            color: newImportRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "import",
            channel: "retail",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      setNewImportRow({
        dno: "",
        type: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
      setTimeout(() => importDnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error creating import entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create import entries: " + (axiosError || errorMsg));
    }
  };

  const handleEditImportRow = (dno: string, color: string) => {
    const key = `${dno}_${color}`;
    setEditingImportRow(key);
    const row = importRows.find(r => r.dno === dno && r.color === color);
    if (row) {
      setEditImportForm({...row});
    }
  };

  const handleUpdateImportRow = async (dno: string, color: string) => {
    try {
      const entriesToDelete = entries.filter(e => 
        e.formType === "import" && e.dno === dno && e.color === color
      );
      
      const deletePromises = entriesToDelete.map(entry => 
        api.delete(`/shop/${entry._id}`)
      );
      
      await Promise.all(deletePromises);
      
      const promises = SIZES.map(size => {
        const qty = editImportForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/shop", {
            dno: editImportForm.dno,
            type: editImportForm.type,
            color: editImportForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "import",
            channel: "retail",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      setEditingImportRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating import entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to update import entries: " + (axiosError || errorMsg));
    }
  };

  const handleDeleteImportRow = async (dno: string, color: string) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${dno} - ${color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "import" && e.dno === dno && e.color === color
        );
        
        const deletePromises = entriesToDelete.map(entry => 
          api.delete(`/shop/${entry._id}`)
        );
        
        await Promise.all(deletePromises);
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting import entries:", err);
        alert("Failed to delete import entries");
      }
    }
  };

  const handleCancelImport = () => {
    setIsCreatingImport(false);
    setNewImportRow({
      dno: "",
      type: "",
      color: "",
      sizes: {}
    });
  };

  // Return form handlers with horizontal size columns
  const handleReturnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, currentField: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (currentField === 'dno') {
        returnTypeRef.current?.focus();
      } else if (currentField === 'type') {
        returnColorRef.current?.focus();
      } else if (currentField === 'color') {
        returnSizeRefs.current['S']?.focus();
      } else if (currentField.startsWith('size-')) {
        const size = currentField.replace('size-', '');
        const currentIndex = SIZES.indexOf(size);
        if (currentIndex < SIZES.length - 1) {
          const nextSize = SIZES[currentIndex + 1];
          returnSizeRefs.current[nextSize]?.focus();
        } else {
          handleSaveReturnRow();
        }
      }
    }
  };

  const handleSaveReturnRow = async () => {
    try {
      const promises = SIZES.map(size => {
        const qty = newReturnRow.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/shop", {
            dno: newReturnRow.dno,
            type: newReturnRow.type,
            color: newReturnRow.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "return",
            channel: "retail",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      setNewReturnRow({
        dno: "",
        type: "",
        color: "",
        sizes: {}
      });
      fetchEntries();
      setTimeout(() => returnDnoRef.current?.focus(), 100);
    } catch (err: unknown) {
      console.error("Error creating return entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to create return entries: " + (axiosError || errorMsg));
    }
  };

  const handleEditReturnRow = (dno: string, color: string) => {
    const key = `${dno}_${color}`;
    setEditingReturnRow(key);
    const row = returnRows.find(r => r.dno === dno && r.color === color);
    if (row) {
      setEditReturnForm({...row});
    }
  };

  const handleUpdateReturnRow = async (dno: string, color: string) => {
    try {
      const entriesToDelete = entries.filter(e => 
        e.formType === "return" && e.dno === dno && e.color === color
      );
      
      const deletePromises = entriesToDelete.map(entry => 
        api.delete(`/shop/${entry._id}`)
      );
      
      await Promise.all(deletePromises);
      
      const promises = SIZES.map(size => {
        const qty = editReturnForm.sizes[size] || 0;
        if (qty > 0) {
          return api.post("/shop", {
            dno: editReturnForm.dno,
            type: editReturnForm.type,
            color: editReturnForm.color,
            size: size,
            qty: qty,
            date: new Date().toISOString().split("T")[0],
            formType: "return",
            channel: "retail",
          });
        }
        return null;
      }).filter(p => p !== null);
      
      await Promise.all(promises);
      
      setEditingReturnRow(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating return entries:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to update return entries: " + (axiosError || errorMsg));
    }
  };

  const handleDeleteReturnRow = async (dno: string, color: string) => {
    if (window.confirm(`Are you sure you want to delete all entries for ${dno} - ${color}?`)) {
      try {
        const entriesToDelete = entries.filter(e => 
          e.formType === "return" && e.dno === dno && e.color === color
        );
        
        const deletePromises = entriesToDelete.map(entry => 
          api.delete(`/shop/${entry._id}`)
        );
        
        await Promise.all(deletePromises);
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting return entries:", err);
        alert("Failed to delete return entries");
      }
    }
  };

  const handleCancelReturn = () => {
    setIsCreatingReturn(false);
    setNewReturnRow({
      dno: "",
      type: "",
      color: "",
      sizes: {}
    });
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEntries.map(entry => ({
      DNO: entry.dno,
      Type: entry.type,
      Color: entry.color,
      Size: entry.size,
      Quantity: entry.qty,
      Date: entry.date?.split("T")[0],
      Channel: entry.channel,
      FormType: entry.formType,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shop Transactions");
    XLSX.writeFile(workbook, `shop_transactions_${selectedFormType}_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const handleImportFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Import each row
        for (const row of jsonData) {
          await api.post("/shop", {
            dno: row.DNO || row.dno,
            type: row.Type || row.type,
            color: row.Color || row.color,
            size: row.Size || row.size,
            qty: Number(row.Quantity || row.qty),
            date: row.Date || row.date,
            channel: row.Channel || row.channel || "retail",
            formType: row.FormType || row.formType || selectedFormType,
          });
        }

        alert(`Successfully imported ${jsonData.length} entries!`);
        fetchEntries();
      } catch (err) {
        console.error("Error importing Excel:", err);
        alert("Failed to import Excel file. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shop Dashboard</h1>
              <p className="text-gray-600">View and manage shop transactions</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              + New Transaction
            </button>
          </div>

          {/* Excel Import/Export Buttons */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleExportToExcel}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <span>📊</span> Export to Excel
            </button>
            <label className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 cursor-pointer">
              <span>📥</span> Import from Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
            </label>
          </div>

          {/* Form Type Buttons - Hidden when locked */}
          {!lockedFormType && (
            <div className="mb-6 border-b pb-4">
              <h3 className="text-lg text-black font-semibold mb-3">Transaction Type</h3>
              <div className="flex flex-wrap gap-3">
                {["import", "sales", "return"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedFormType(type as "import" | "sales" | "return")}
                    className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${selectedFormType === type
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {lockedFormType && (
            <div className="mb-6 border-b pb-4 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg text-black font-semibold mb-2">Transaction Type</h3>
              <p className="text-sm text-gray-700">
                <span className="font-semibold capitalize">{lockedFormType}</span>
              </p>
            </div>
          )}

          {/* Form Type Buttons for Creating New Entry */}
          {isCreating && (
            <div className="mb-4 border-t pt-4 border-gray-300">
              <h3 className="text-lg font-semibold mb-3">Confirm Form Type</h3>
              <p className="text-sm text-gray-600 mb-3">Creating new entry for: <span className="font-semibold capitalize">{selectedFormType}</span></p>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <input type="text"
              placeholder="Search by DNO, Type, or Color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={filterChannel}
              onChange={(e) => setFilterChannel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option>All Channels</option>
              <option>retail</option>
              <option>online</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
          </div>
        ) : (selectedFormType === "import" || selectedFormType === "return") ? (
          // Horizontal size column format for import and return
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Design Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    {SIZES.map(size => (
                      <th key={size} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{size}</th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedFormType === "import" && isCreatingImport && (
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4">
                        <input 
                          ref={importDnoRef}
                          type="text" 
                          value={newImportRow.dno} 
                          onChange={(e) => setNewImportRow({...newImportRow, dno: e.target.value})} 
                          onKeyDown={(e) => handleImportKeyDown(e, 'dno')}
                          placeholder="DNO" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          ref={importTypeRef}
                          type="text" 
                          value={newImportRow.type} 
                          onChange={(e) => setNewImportRow({...newImportRow, type: e.target.value})} 
                          onKeyDown={(e) => handleImportKeyDown(e, 'type')}
                          placeholder="Type" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          ref={importColorRef}
                          type="text" 
                          value={newImportRow.color} 
                          onChange={(e) => setNewImportRow({...newImportRow, color: e.target.value})} 
                          onKeyDown={(e) => handleImportKeyDown(e, 'color')}
                          placeholder="Color" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date().toISOString().split("T")[0]}
                      </td>
                      {SIZES.map(size => (
                        <td key={size} className="px-6 py-4">
                          <input 
                            ref={(el) => {
                              importSizeRefs.current[size] = el;
                            }}
                            type="number" 
                            value={newImportRow.sizes[size] || ""} 
                            onChange={(e) => setNewImportRow({
                              ...newImportRow, 
                              sizes: {...newImportRow.sizes, [size]: Number(e.target.value) || 0}
                            })} 
                            onKeyDown={(e) => handleImportKeyDown(e, `size-${size}`)}
                            placeholder="Qty" 
                            className="w-20 px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <button onClick={handleSaveImportRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancelImport} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {selectedFormType === "return" && isCreatingReturn && (
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4">
                        <input 
                          ref={returnDnoRef}
                          type="text" 
                          value={newReturnRow.dno} 
                          onChange={(e) => setNewReturnRow({...newReturnRow, dno: e.target.value})} 
                          onKeyDown={(e) => handleReturnKeyDown(e, 'dno')}
                          placeholder="DNO" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          ref={returnTypeRef}
                          type="text" 
                          value={newReturnRow.type} 
                          onChange={(e) => setNewReturnRow({...newReturnRow, type: e.target.value})} 
                          onKeyDown={(e) => handleReturnKeyDown(e, 'type')}
                          placeholder="Type" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          ref={returnColorRef}
                          type="text" 
                          value={newReturnRow.color} 
                          onChange={(e) => setNewReturnRow({...newReturnRow, color: e.target.value})} 
                          onKeyDown={(e) => handleReturnKeyDown(e, 'color')}
                          placeholder="Color" 
                          className="w-full px-2 py-1 border rounded text-black bg-white" 
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date().toISOString().split("T")[0]}
                      </td>
                      {SIZES.map(size => (
                        <td key={size} className="px-6 py-4">
                          <input 
                            ref={(el) => {
                              returnSizeRefs.current[size] = el;
                            }}
                            type="number" 
                            value={newReturnRow.sizes[size] || ""} 
                            onChange={(e) => setNewReturnRow({
                              ...newReturnRow, 
                              sizes: {...newReturnRow.sizes, [size]: Number(e.target.value) || 0}
                            })} 
                            onKeyDown={(e) => handleReturnKeyDown(e, `size-${size}`)}
                            placeholder="Qty" 
                            className="w-20 px-2 py-1 border rounded text-black bg-white" 
                          />
                        </td>
                      ))}
                      <td className="px-6 py-4">
                        <button onClick={handleSaveReturnRow} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancelReturn} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {selectedFormType === "import" && filteredGroupedRows.map((row, idx) => {
                    const rowKey = `${row.dno}_${row.color}`;
                    const isEditing = editingImportRow === rowKey;
                    
                    return (
                      <tr key={idx} className={isEditing ? "bg-blue-50" : ""}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editImportForm.dno} 
                                onChange={(e) => setEditImportForm({...editImportForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editImportForm.type} 
                                onChange={(e) => setEditImportForm({...editImportForm, type: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editImportForm.color} 
                                onChange={(e) => setEditImportForm({...editImportForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.date ? row.date.split("T")[0] : "-"}
                            </td>
                            {SIZES.map(size => (
                              <td key={size} className="px-6 py-4">
                                <input 
                                  type="number" 
                                  value={editImportForm.sizes[size] || ""} 
                                  onChange={(e) => setEditImportForm({
                                    ...editImportForm, 
                                    sizes: {...editImportForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-20 px-2 py-1 border rounded text-black bg-white" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4">
                              <button onClick={() => handleUpdateImportRow(row.dno, row.color)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingImportRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.date ? row.date.split("T")[0] : "-"}
                            </td>
                            {SIZES.map(size => (
                              <td key={size} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.sizes[size] || 0}</td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditImportRow(row.dno, row.color)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeleteImportRow(row.dno, row.color)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                  {selectedFormType === "return" && filteredGroupedRows.map((row, idx) => {
                    const rowKey = `${row.dno}_${row.color}`;
                    const isEditing = editingReturnRow === rowKey;
                    
                    return (
                      <tr key={idx} className={isEditing ? "bg-blue-50" : ""}>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editReturnForm.dno} 
                                onChange={(e) => setEditReturnForm({...editReturnForm, dno: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editReturnForm.type} 
                                onChange={(e) => setEditReturnForm({...editReturnForm, type: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input 
                                type="text" 
                                value={editReturnForm.color} 
                                onChange={(e) => setEditReturnForm({...editReturnForm, color: e.target.value})} 
                                className="w-full px-2 py-1 border rounded text-black bg-white" 
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.date ? row.date.split("T")[0] : "-"}
                            </td>
                            {SIZES.map(size => (
                              <td key={size} className="px-6 py-4">
                                <input 
                                  type="number" 
                                  value={editReturnForm.sizes[size] || ""} 
                                  onChange={(e) => setEditReturnForm({
                                    ...editReturnForm, 
                                    sizes: {...editReturnForm.sizes, [size]: Number(e.target.value) || 0}
                                  })} 
                                  className="w-20 px-2 py-1 border rounded text-black bg-white" 
                                />
                              </td>
                            ))}
                            <td className="px-6 py-4">
                              <button onClick={() => handleUpdateReturnRow(row.dno, row.color)} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                              <button onClick={() => setEditingReturnRow(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.date ? row.date.split("T")[0] : "-"}
                            </td>
                            {SIZES.map(size => (
                              <td key={size} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.sizes[size] || 0}</td>
                            ))}
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={() => handleEditReturnRow(row.dno, row.color)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                              <button onClick={() => handleDeleteReturnRow(row.dno, row.color)} className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {selectedFormType === "import" && filteredGroupedRows.length === 0 && !isCreatingImport && (
                <div className="text-center py-12 text-gray-500">
                  No import transactions found.
                </div>
              )}
              {selectedFormType === "return" && filteredGroupedRows.length === 0 && !isCreatingReturn && (
                <div className="text-center py-12 text-gray-500">
                  No return transactions found.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DNO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isCreating && (
                    <tr className="bg-blue-50">
                      <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({ ...editForm, dno: e.target.value })} onKeyDown={(e) => handleKeyDown(e, typeRef)} placeholder="DNO" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} onKeyDown={(e) => handleKeyDown(e, colorRef)} placeholder="Type" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} onKeyDown={(e) => handleKeyDown(e, sizeRef)} placeholder="Color" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} onKeyDown={(e) => handleKeyDown(e, qtyRef)} placeholder="Size" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })} onKeyDown={(e) => handleKeyDown(e, dateRef)} placeholder="Qty" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} onKeyDown={(e) => handleKeyDown(e, channelRef)} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4">
                        <select ref={channelRef} value={editForm.channel} onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAndContinue(); } }} className="w-full px-2 py-1 border rounded text-black bg-white">
                          <option value="retail">Retail</option>
                          <option value="online">Online</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={handleSaveNew} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {limitedEntries.map((entry) => (
                    <tr key={entry._id}>
                      {editingEntry === entry._id ? (
                        <>
                          <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({ ...editForm, dno: e.target.value })} onKeyDown={(e) => handleKeyDown(e, typeRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} onKeyDown={(e) => handleKeyDown(e, colorRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} onKeyDown={(e) => handleKeyDown(e, sizeRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })} onKeyDown={(e) => handleKeyDown(e, qtyRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })} onKeyDown={(e) => handleKeyDown(e, dateRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} onKeyDown={(e) => handleKeyDown(e, channelRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4">
                            <select ref={channelRef} value={editForm.channel} onChange={(e) => setEditForm({ ...editForm, channel: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAndContinue(entry._id); } }} className="w-full px-2 py-1 border rounded  text-black">
                              <option value="retail">Retail</option>
                              <option value="online">Online</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <button onClick={() => handleUpdate(entry._id)} className="text-green-600 hover:text-green-900 mr-3">Save</button>
                            <button onClick={() => setEditingEntry(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.dno}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.color}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.size}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.qty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date?.split("T")[0]}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.channel}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleEdit(entry)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                            <button onClick={() => handleDelete(entry._id)} className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEntries.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No transactions found. <Link href="/shop/form" className="text-blue-600 hover:underline">Create your first transaction</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <ShopDashboard />
    </Suspense>
  );
}