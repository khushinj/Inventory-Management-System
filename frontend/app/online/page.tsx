"use client";

import { useState, useEffect, useRef } from "react";
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
  formType?: string;
  receiver?: string;
  supplier?: string;
  transferType?: string;
  platform?: string;
  domain: string;
  warehouseType?: string;
};

export default function OnlineDashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedFormType, setSelectedFormType] = useState<string>("sales");
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: "",
    formType: "",
    platform: "",
    transferType: "",
    receiver: "",
    supplier: "",
  });

  const dnoRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const additionalFieldRef = useRef<HTMLInputElement>(null);

  const [platformOptions] = useState<string[]>([
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
  ]);
  const [transferOptions] = useState<string[]>([
    "inwards",
    "outwards",
  ]);
  const [filteredPlatformOptions, setFilteredPlatformOptions] = useState<string[]>(platformOptions);
  const [filteredTransferOptions, setFilteredTransferOptions] = useState<string[]>(transferOptions);
  const [showPlatformDropdown, setShowPlatformDropdown] = useState(false);
  const [showTransferDropdown, setShowTransferDropdown] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const onlineRes = await api.get("/warehouse/online");
      setEntries(onlineRes.data);
    } catch (err: unknown) {
      console.error("Error fetching entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.formType?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFormType =
      entry.formType === selectedFormType;

    return matchesSearch && matchesFormType;
  });

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
      size: entry.size || "",
      qty: entry.qty?.toString() || "",
      date: entry.date?.split("T")[0] || "",
      formType: entry.formType || "",
      platform: entry.platform || "",
      transferType: entry.transferType || "",
      receiver: entry.receiver || "",
      supplier: entry.supplier || "",
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        date: editForm.date,
        formType: editForm.formType || "return",
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.platform && { platform: editForm.platform }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
      };
      
      await api.patch(`/warehouse/online/${id}`, payload);
      setEditingEntry(null);
      fetchEntries();
    } catch (err: unknown) {
      console.error("Error updating entry:", err);
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const axiosError = err && typeof err === "object" && "response" in err ? (err as any).response?.data?.error : undefined;
      alert("Failed to update entry: " + (axiosError || errorMsg));
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry?")) {
      try {
        await api.delete(`/warehouse/online/${id}`);
        fetchEntries();
      } catch (err: unknown) {
        console.error("Error deleting entry:", err);
        alert("Failed to delete entry");
      }
    }
  };

  const handleCreate = () => {
    setEditForm({
      dno: "",
      type: "",
      color: "",
      size: "",
      qty: "",
      date: new Date().toISOString().split("T")[0],
      formType: selectedFormType,
      platform: "",
      transferType: "",
      receiver: "",
      supplier: "",
    });
    setIsCreating(true);
  };

  const handleSaveNew = async () => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        date: editForm.date,
        formType: selectedFormType,
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.platform && { platform: editForm.platform }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
      };
      
      await api.post("/warehouse/online", payload);
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
    nextRef?: React.RefObject<HTMLInputElement | HTMLSelectElement | null>,
    isLastField?: boolean,
    entryId?: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLastField) {
        handleSaveAndContinue(entryId);
      } else {
        nextRef?.current?.focus();
      }
    }
  };

  const handlePlatformInputChange = (value: string) => {
    setEditForm({...editForm, platform: value});
    const filtered = platformOptions.filter(option => 
      option.toLowerCase().includes(value.toLowerCase())
    ).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
    setFilteredPlatformOptions(filtered);
  };

  const handleTransferInputChange = (value: string) => {
    setEditForm({...editForm, transferType: value});
    const filtered = transferOptions.filter(option => 
      option.toLowerCase().includes(value.toLowerCase())
    ).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(value.toLowerCase());
      const bStarts = b.toLowerCase().startsWith(value.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
    setFilteredTransferOptions(filtered);
  };

  const handleSaveAndContinue = async (entryId?: string) => {
    try {
      const payload = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        date: editForm.date,
        formType: entryId ? editForm.formType || "return" : selectedFormType,
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.platform && { platform: editForm.platform }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
      };
      
      if (entryId) {
        await api.patch(`/warehouse/online/${entryId}`, payload);
        setEditingEntry(null);
      } else {
        await api.post("/warehouse/online", payload);
      }
      
      // Reset form and prepare for next entry
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        date: new Date().toISOString().split("T")[0],
        formType: selectedFormType,
        platform: "",
        transferType: "",
        receiver: "",
        supplier: "",
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

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEntries.map(entry => ({
      DNO: entry.dno,
      Type: entry.type,
      Color: entry.color,
      Size: entry.size,
      Quantity: entry.qty,
      Date: entry.date?.split("T")[0],
      FormType: entry.formType,
      Platform: entry.platform,
      TransferType: entry.transferType,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Online Transactions");
    XLSX.writeFile(workbook, `online_transactions_${selectedFormType}_${new Date().toISOString().split("T")[0]}.xlsx`);
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
          await api.post("/warehouse/online", {
            dno: row.DNO || row.dno,
            type: row.Type || row.type,
            color: row.Color || row.color,
            size: row.Size || row.size,
            qty: Number(row.Quantity || row.qty),
            date: row.Date || row.date,
            formType: row.FormType || row.formType || selectedFormType,
            platform: row.Platform || row.platform,
            transferType: row.TransferType || row.transferType,
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Online Warehouse Dashboard</h1>
              <p className="text-gray-600">View and manage online warehouse transactions</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              + New Transaction
            </button>
          </div>

          {/* Excel Import/Export Buttons */}
          <div className="mb-6 flex gap-3">
            <button
              onClick={handleExportToExcel}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors flex items-center gap-2"
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

          {/* Form Type Buttons - Always Visible */}
          <div className="mb-6 border-b pb-4">
            <h3 className="text-lg font-semibold mb-3">Transaction Type</h3>
            <div className="flex flex-wrap gap-3">
              {["return", "sales", "transfer", "purchase"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedFormType(type)}
                  className={`px-6 py-3 rounded-lg font-semibold capitalize transition-all ${
                    selectedFormType === type
                      ? "bg-orange-600 text-white shadow-lg"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Form Type Buttons for Creating New Entry */}
          {isCreating && (
            <div className="mb-4 border-t pt-4 border-gray-300">
              <h3 className="text-lg font-semibold mb-3">Confirm Form Type</h3>
              <p className="text-sm text-gray-600 mb-3">Creating new entry for: <span className="font-semibold capitalize">{selectedFormType}</span></p>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <input
              type="text"
              placeholder="Search by DNO, Type, Color, or Form Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            <p className="mt-4 text-gray-600">Loading transactions...</p>
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
                    {selectedFormType === "purchase" && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                    )}
                    {selectedFormType === "transfer" && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiver</th>
                      </>
                    )}
                    {(selectedFormType === "return" || selectedFormType === "sales") && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform</th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isCreating && (
                    <tr className="bg-orange-50">
                      <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} onKeyDown={(e) => handleKeyDown(e, typeRef)} placeholder="DNO" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} onKeyDown={(e) => handleKeyDown(e, colorRef)} placeholder="Type" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} onKeyDown={(e) => handleKeyDown(e, sizeRef)} placeholder="Color" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} onKeyDown={(e) => handleKeyDown(e, qtyRef)} placeholder="Size" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} onKeyDown={(e) => handleKeyDown(e, dateRef)} placeholder="Qty" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} onKeyDown={(e) => {
                        if (selectedFormType === "purchase" || selectedFormType === "transfer" || selectedFormType === "return" || selectedFormType === "sales") {
                          handleKeyDown(e, additionalFieldRef);
                        } else {
                          handleKeyDown(e, undefined, true);
                        }
                      }} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      {selectedFormType === "purchase" && (
                        <td className="px-6 py-4"><input ref={additionalFieldRef} type="text" value={editForm.supplier} onChange={(e) => setEditForm({...editForm, supplier: e.target.value})} onKeyDown={(e) => handleKeyDown(e, undefined, true)} placeholder="Supplier" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      )}
                      {selectedFormType === "transfer" && (
                        <>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <input
                                ref={additionalFieldRef}
                                type="text"
                                value={editForm.transferType}
                                onChange={(e) => handleTransferInputChange(e.target.value)}
                                onFocus={() => setShowTransferDropdown(true)}
                                onBlur={() => setTimeout(() => setShowTransferDropdown(false), 200)}
                                placeholder="Transfer Type"
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                              {showTransferDropdown && filteredTransferOptions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                  {filteredTransferOptions.map((option, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() => {
                                        setEditForm({...editForm, transferType: option});
                                        setShowTransferDropdown(false);
                                      }}
                                      className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-black"
                                    >
                                      {option}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4"><input type="text" value={editForm.receiver} onChange={(e) => setEditForm({...editForm, receiver: e.target.value})} onKeyDown={(e) => handleKeyDown(e, undefined, true)} placeholder="Receiver" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                        </>
                      )}
                      {(selectedFormType === "return" || selectedFormType === "sales") && (
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input
                              ref={additionalFieldRef}
                              type="text"
                              value={editForm.platform}
                              onChange={(e) => handlePlatformInputChange(e.target.value)}
                              onFocus={() => setShowPlatformDropdown(true)}
                              onBlur={() => setTimeout(() => setShowPlatformDropdown(false), 200)}
                              onKeyDown={(e) => handleKeyDown(e, undefined, true)}
                              placeholder="Platform"
                              className="w-full px-2 py-1 border rounded text-black bg-white"
                            />
                            {showPlatformDropdown && filteredPlatformOptions.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                {filteredPlatformOptions.map((option, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setEditForm({...editForm, platform: option});
                                      setShowPlatformDropdown(false);
                                    }}
                                    className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-black"
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <button onClick={handleSaveNew} className="text-orange-600 hover:text-orange-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id}>
                      {editingEntry === entry._id ? (
                        <>
                          <td className="px-6 py-4"><input ref={dnoRef} type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} onKeyDown={(e) => handleKeyDown(e, typeRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={typeRef} type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} onKeyDown={(e) => handleKeyDown(e, colorRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={colorRef} type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} onKeyDown={(e) => handleKeyDown(e, sizeRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={sizeRef} type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} onKeyDown={(e) => handleKeyDown(e, qtyRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={qtyRef} type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} onKeyDown={(e) => handleKeyDown(e, dateRef)} className="w-full px-2 py-1 border rounded text-black" /></td>
                          <td className="px-6 py-4"><input ref={dateRef} type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} onKeyDown={(e) => {
                            const formType = editForm.formType || "return";
                            if (formType === "purchase" || formType === "transfer" || formType === "return" || formType === "sales") {
                              handleKeyDown(e, additionalFieldRef);
                            } else {
                              handleKeyDown(e, undefined, true, entry._id);
                            }
                          }} className="w-full px-2 py-1 border rounded text-black" /></td>
                          {editForm.formType === "purchase" && (
                            <td className="px-6 py-4"><input ref={additionalFieldRef} type="text" value={editForm.supplier} onChange={(e) => setEditForm({...editForm, supplier: e.target.value})} onKeyDown={(e) => handleKeyDown(e, undefined, true, entry._id)} placeholder="Supplier" className="w-full px-2 py-1 border rounded text-black" /></td>
                          )}
                          {editForm.formType === "transfer" && (
                            <>
                              <td className="px-6 py-4">
                                <div className="relative">
                                  <input
                                    ref={additionalFieldRef}
                                    type="text"
                                    value={editForm.transferType}
                                    onChange={(e) => handleTransferInputChange(e.target.value)}
                                    onFocus={() => setShowTransferDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowTransferDropdown(false), 200)}
                                    placeholder="Transfer Type"
                                    className="w-full px-2 py-1 border rounded text-black"
                                  />
                                  {showTransferDropdown && filteredTransferOptions.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                      {filteredTransferOptions.map((option, idx) => (
                                        <div
                                          key={idx}
                                          onClick={() => {
                                            setEditForm({...editForm, transferType: option});
                                            setShowTransferDropdown(false);
                                          }}
                                          className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-black"
                                        >
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4"><input type="text" value={editForm.receiver} onChange={(e) => setEditForm({...editForm, receiver: e.target.value})} onKeyDown={(e) => handleKeyDown(e, undefined, true, entry._id)} placeholder="Receiver" className="w-full px-2 py-1 border rounded text-black" /></td>
                            </>
                          )}
                          {(editForm.formType === "return" || editForm.formType === "sales") && (
                            <td className="px-6 py-4">
                              <div className="relative">
                                <input
                                  ref={additionalFieldRef}
                                  type="text"
                                  value={editForm.platform}
                                  onChange={(e) => handlePlatformInputChange(e.target.value)}
                                  onFocus={() => setShowPlatformDropdown(true)}
                                  onBlur={() => setTimeout(() => setShowPlatformDropdown(false), 200)}
                                  onKeyDown={(e) => handleKeyDown(e, undefined, true, entry._id)}
                                  placeholder="Platform"
                                  className="w-full px-2 py-1 border rounded text-black"
                                />
                                {showPlatformDropdown && filteredPlatformOptions.length > 0 && (
                                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                                    {filteredPlatformOptions.map((option, idx) => (
                                      <div
                                        key={idx}
                                        onClick={() => {
                                          setEditForm({...editForm, platform: option});
                                          setShowPlatformDropdown(false);
                                        }}
                                        className="px-3 py-2 hover:bg-orange-50 cursor-pointer text-black"
                                      >
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          )}
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
                          {entry.formType === "purchase" && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.supplier}</td>
                          )}
                          {entry.formType === "transfer" && (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.transferType}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.receiver}</td>
                            </>
                          )}
                          {(entry.formType === "return" || entry.formType === "sales") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.platform}</td>
                          )}
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
                  No transactions found. <Link href="/online/form" className="text-orange-600 hover:underline">Create your first transaction</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
