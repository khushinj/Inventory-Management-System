"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

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
  domain: string;
  warehouseType?: string;
};

export default function ExportDashboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: "",
    formType: "",
    receiver: "",
    supplier: "",
    transferType: "",
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const exportRes = await api.get("/api/warehouse/export");
      setEntries(exportRes.data);
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

    return matchesSearch;
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
      receiver: entry.receiver || "",
      supplier: entry.supplier || "",
      transferType: entry.transferType || "",
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
        formType: editForm.formType || "dispatch",
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
      };
      
      await api.patch(`/api/warehouse/export/${id}`, payload);
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
        await api.delete(`/api/warehouse/export/${id}`);
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
      formType: "dispatch",
      receiver: "",
      supplier: "",
      transferType: "",
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
        formType: editForm.formType || "dispatch",
        ...(editForm.transferType && { transferType: editForm.transferType }),
        ...(editForm.receiver && { receiver: editForm.receiver }),
        ...(editForm.supplier && { supplier: editForm.supplier }),
      };
      
      await api.post("/api/warehouse/export", payload);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Warehouse Dashboard</h1>
              <p className="text-gray-600">View and manage export warehouse transactions</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              + New Transaction
            </button>
          </div>

          <div className="flex gap-4 mt-6">
            <input
              type="text"
              placeholder="Search by DNO, Type, Color, or Form Type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2  text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isCreating && (
                    <tr className="bg-purple-50">
                      <td className="px-6 py-4"><input type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} placeholder="DNO" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} placeholder="Type" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} placeholder="Color" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} placeholder="Size" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} placeholder="Qty" className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4"><input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                      <td className="px-6 py-4">
                        <select value={editForm.formType} onChange={(e) => setEditForm({...editForm, formType: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white">
                          <option value="dispatch">Dispatch</option>
                          <option value="production">Production</option>
                          <option value="purchase">Purchase</option>
                          <option value="transfer">Transfer</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button onClick={handleSaveNew} className="text-green-600 hover:text-green-900 mr-3 font-medium">Save</button>
                        <button onClick={handleCancel} className="text-gray-600 hover:text-gray-900">Cancel</button>
                      </td>
                    </tr>
                  )}
                  {filteredEntries.map((entry) => (
                    <tr key={entry._id}>
                      {editingEntry === entry._id ? (
                        <>
                          <td className="px-6 py-4"><input type="text" value={editForm.dno} onChange={(e) => setEditForm({...editForm, dno: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4"><input type="text" value={editForm.type} onChange={(e) => setEditForm({...editForm, type: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4"><input type="text" value={editForm.color} onChange={(e) => setEditForm({...editForm, color: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4"><input type="text" value={editForm.size} onChange={(e) => setEditForm({...editForm, size: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4"><input type="number" value={editForm.qty} onChange={(e) => setEditForm({...editForm, qty: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4"><input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white" /></td>
                          <td className="px-6 py-4">
                            <select value={editForm.formType} onChange={(e) => setEditForm({...editForm, formType: e.target.value})} className="w-full px-2 py-1 border rounded text-black bg-white">
                              <option value="dispatch">Dispatch</option>
                              <option value="production">Production</option>
                              <option value="purchase">Purchase</option>
                              <option value="transfer">Transfer</option>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.formType}</td>
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
                  No transactions found. <Link href="/export/form" className="text-purple-600 hover:underline">Create your first transaction</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
