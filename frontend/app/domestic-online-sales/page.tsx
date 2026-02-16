"use client";

import { useState, useRef, useEffect } from "react";
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
  channel?: string;
  domain: string;
};

export default function DomesticOnlineSalesPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: new Date().toISOString()[0],
  });

  const dnoRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLInputElement>(null);
  const colorRef = useRef<HTMLInputElement>(null);
  const sizeRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get("/warehouse/domestic?formType=sales&channel=online");
      setEntries(response.data);
    } catch (error) {
      console.error("Error fetching entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLInputElement>,
    isLastField?: boolean
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef) {
        nextRef.current?.focus();
      } else if (isLastField) {
        handleSave();
      }
    }
  };

  const handleSave = async () => {
    if (!editForm.dno.trim() || !editForm.color.trim() || !editForm.size.trim() || !editForm.qty) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const dataToSave = {
        dno: editForm.dno,
        type: editForm.type,
        color: editForm.color,
        size: editForm.size,
        qty: Number(editForm.qty),
        date: editForm.date,
        formType: "sales",
        channel: "online",
        domain: "domestic",
      };

      if (editingEntry) {
        await api.patch(`/warehouse/domestic/${editingEntry}`, dataToSave);
      } else {
        await api.post("/warehouse/domestic", dataToSave);
      }

      await fetchEntries();
      
      setEditingEntry(null);
      setEditForm({
        dno: "",
        type: "",
        color: "",
        size: "",
        qty: "",
        date: new Date().toISOString().split("T")[0],
      });
      dnoRef.current?.focus();
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry");
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry._id);
    setEditForm({
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
      size: entry.size || "",
      qty: entry.qty.toString(),
      date: entry.date || new Date().toISOString().split("T")[0],
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      await api.delete(`/warehouse/domestic/${id}`);
      await fetchEntries();
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      alert(`Failed to delete entry: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCancel = () => {
    setEditingEntry(null);
    setEditForm({
      dno: "",
      type: "",
      color: "",
      size: "",
      qty: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsCreating(false);
  };

  const filteredEntries = entries.filter((entry) =>
    entry.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.color?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredEntries.map(entry => ({
      DNO: entry.dno,
      Type: entry.type,
      Color: entry.color,
      Size: entry.size,
      Quantity: entry.qty,
      Date: entry.date?.split("T")[0],
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Online Sales");
    XLSX.writeFile(workbook, `online_sales_${new Date().toISOString().split("T")[0]}.xlsx`);
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
          await api.post("/warehouse/domestic", {
            dno: row.DNO || row.dno,
            type: row.Type || row.type,
            color: row.Color || row.color,
            size: row.Size || row.size,
            qty: Number(row.Quantity || row.qty),
            date: row.Date || row.date,
            formType: "sales",
            channel: "online",
          });
        }

        alert(`Successfully imported ${jsonData.length} entries!`);
        await fetchEntries();
      } catch (err) {
        console.error("Error importing Excel:", err);
        alert("Failed to import Excel file. Please check the file format.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // Reset input
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    return dateString.split("T")[0]; // Ensure only YYYY-MM-DD format
  };

  return (
    <div className="min-h-screen bg-gray-50 text-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Domestic Online Sales</h1>
          <p className="text-gray-600">Manage online sales entries</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by DNO or Color..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-black bg-white"
              />
            </div>
            {!isCreating && (
              <div className="ml-4 flex gap-2">
                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  📥 Export to Excel
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  📤 Import from Excel
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    setEditForm({
                      dno: "",
                      type: "",
                      color: "",
                      size: "",
                      qty: "",
                      date: new Date().toISOString().split("T")[0],
                    });
                    setIsCreating(true);
                    setTimeout(() => dnoRef.current?.focus(), 0);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                >
                  + Add Entry
                </button>
              </div>
            )}
          </div>

          {loading && <div className="text-center py-8 text-gray-500">Loading entries...</div>}

          {!loading && (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isCreating && (
                    <tr className="bg-green-50">
                      <td className="px-6 py-4">
                        <input
                          ref={dnoRef}
                          type="text"
                          value={editForm.dno}
                          onChange={(e) => setEditForm({ ...editForm, dno: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, typeRef)}
                          placeholder="DNO"
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={typeRef}
                          type="text"
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, colorRef)}
                          placeholder="Type"
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={colorRef}
                          type="text"
                          value={editForm.color}
                          onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, sizeRef)}
                          placeholder="Color"
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={sizeRef}
                          type="text"
                          value={editForm.size}
                          onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, qtyRef)}
                          placeholder="Size"
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={qtyRef}
                          type="number"
                          value={editForm.qty}
                          onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, dateRef)}
                          placeholder="Qty"
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          ref={dateRef}
                          type="date"
                          value={editForm.date}
                          onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                          onKeyDown={(e) => handleKeyDown(e, undefined, true)}
                          className="w-full px-2 py-1 border rounded text-black bg-white"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-3 font-medium">
                          Save
                        </button>
                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">
                          Cancel
                        </button>
                      </td>
                    </tr>
                  )}
                  {filteredEntries.length === 0 && !isCreating ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        {entries.length === 0 ? "No entries yet. Click 'Add Entry' to get started." : "No matching entries found."}
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50">
                        {editingEntry === entry._id ? (
                          <>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editForm.dno}
                                onChange={(e) => setEditForm({ ...editForm, dno: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editForm.type}
                                onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editForm.color}
                                onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="text"
                                value={editForm.size}
                                onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="number"
                                value={editForm.qty}
                                onChange={(e) => setEditForm({ ...editForm, qty: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <input
                                type="date"
                                value={editForm.date}
                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                className="w-full px-2 py-1 border rounded text-black bg-white"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button onClick={handleSave} className="text-green-600 hover:text-green-900 mr-3 font-medium">
                                Save
                              </button>
                              <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">
                                Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.dno}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.color}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.size}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.qty}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.date)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => handleEdit(entry)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(entry._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
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
