"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState("All Channels");
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    dno: "",
    type: "",
    color: "",
    size: "",
    qty: "",
    date: "",
    channel: "",
    platform: "",
    formType: "",
  });

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const domesticRes = await api.get("/warehouse/domestic");
      const exportRes = await api.get("/warehouse/export");
      const onlineRes = await api.get("/warehouse/online");
      const shopRes = await api.get("/shop");

      const allEntries = [
        ...domesticRes.data,
        ...exportRes.data,
        ...onlineRes.data,
        ...shopRes.data,
      ];
      setEntries(allEntries);
    } catch (err) {
      console.error("Error fetching entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.dno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      filterChannel === "All Channels" ||
      (entry.channel === filterChannel.toLowerCase()) ||
      (entry.platform === filterChannel.toLowerCase());

    return matchesSearch && matchesChannel;
  });

  const totalQty = filteredEntries.reduce((sum, e) => sum + (e.qty || 0), 0);
  const onlineCount = entries.filter((e) => e.warehouseType === "online").length;
  const retailCount = entries.filter((e) => e.channel === "retail").length;

  const openEdit = (entry) => {
    setEditingEntry(entry);
    setEditForm({
      dno: entry.dno || "",
      type: entry.type || "",
      color: entry.color || "",
      size: entry.size || "",
      qty: entry.qty?.toString() || "",
      date: entry.date ? entry.date.split("T")[0] : "",
      channel: entry.channel || "",
      platform: entry.platform || "",
      formType: entry.formType || "",
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const submitEdit = async () => {
    if (!editingEntry) return;
    const endpoint =
      editingEntry.domain === "shop"
        ? `/shop/${editingEntry._id}`
        : `/warehouse/${editingEntry.warehouseType}/${editingEntry._id}`;

    try {
      await api.patch(endpoint, {
        ...editForm,
        qty: editForm.qty ? Number(editForm.qty) : undefined,
      });
      await fetchEntries();
      setEditingEntry(null);
    } catch (err: any) {
      alert(err.response?.data?.error || "Update failed");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Inventory Dashboard</h1>
        <p className="text-gray-600 text-sm sm:text-base">Track and manage your inventory entries</p>
      </div>

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:flex-1 border px-4 py-2 rounded text-sm"
        />
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="w-full sm:w-auto border px-4 py-2 rounded bg-black text-sm"
        >
          <option>All Channels</option>
          <option>Retail</option>
          <option>Online</option>
          <option>Export</option>
        </select>
        <Link href="/forms" className="w-full sm:w-auto">
          <button className="w-full bg-green-600 text-white px-4 sm:px-6 py-2 rounded font-semibold hover:bg-green-700 text-sm">
            + Add Row
          </button>
        </Link>
        <button className="w-full sm:w-auto bg-blue-600 text-white px-4 sm:px-6 py-2 rounded font-semibold hover:bg-blue-700 text-sm">
          ⬇ Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 grid-cols-1 sm:w-full w-3xs gap-2 sm:gap-4">
        <div className="border rounded p-3 sm:p-6">
          <p className="text-gray-600 text-[10px] sm:text-sm mb-1">Total Entries</p>
          <p className="text-lg sm:text-3xl font-bold">{entries.length}</p>
        </div>
        <div className="border rounded p-3 sm:p-6">
          <p className="text-gray-600 text-[10px] sm:text-sm mb-1">Total Quantity</p>
          <p className="text-lg sm:text-3xl font-bold">{totalQty}</p>
        </div>
        <div className="border rounded p-3 sm:p-6">
          <p className="text-gray-600 text-[10px] sm:text-sm mb-1">Online vs Retail</p>
          <p className="text-lg sm:text-3xl font-bold">
            {onlineCount} / {retailCount}
          </p>
        </div>
      </div>

      {/* Table - Only this section scrolls horizontally */}
      <div className="w-full overflow-x-auto border rounded -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-[760px] w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left p-4 font-semibold">DNO</th>
              <th className="text-left p-4 font-semibold">TYPE</th>
              <th className="text-left p-4 font-semibold">COLOUR</th>
              <th className="text-left p-4 font-semibold">SIZE</th>
              <th className="text-left p-4 font-semibold">QTY</th>
              <th className="text-left p-4 font-semibold">DATE</th>
              <th className="text-left p-4 font-semibold">CHANNEL</th>
              <th className="text-left p-4 font-semibold">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No entries found
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry) => (
                <tr key={entry._id} className="border-b hover:bg-black">
                  <td className="p-4 font-semibold">{entry.dno}</td>
                  <td className="p-4">{entry.type}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            entry.color === "Red"
                              ? "#ef4444"
                              : entry.color === "Blue"
                              ? "#3b82f6"
                              : entry.color === "Black"
                              ? "#000000"
                              : "#d1d5db",
                        }}
                      />
                      {entry.color}
                    </span>
                  </td>
                  <td className="p-4">{entry.size}</td>
                  <td className="p-4 rounded">{entry.qty}</td>
                  <td className="p-4">
                    {entry.date
                      ? new Date(entry.date).toISOString().split("T")[0]
                      : "N/A"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        entry.channel === "retail"
                          ? "bg-purple-100 text-purple-800"
                          : entry.channel === "online"
                          ? "bg-green-100 text-green-800"
                          : entry.platform
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {entry.channel || entry.platform || "—"}
                    </span>
                  </td>
                  <td className="p-4 text-blue-600 cursor-pointer hover:underline" onClick={() => openEdit(entry)}>
                    Edit
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Edit modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">Edit Entry</h3>
              <button
                className="text-sm hover:underline text-black"
                onClick={() => setEditingEntry(null)}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm">
                <span className="block text-black mb-1">DNO</span>
                <input name="dno" value={editForm.dno} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Type</span>
                <input name="type" value={editForm.type} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Color</span>
                <input name="color" value={editForm.color} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Size</span>
                <input name="size" value={editForm.size} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Qty</span>
                <input name="qty" type="number" value={editForm.qty} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Date</span>
                <input name="date" type="date" value={editForm.date} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Channel</span>
                <input name="channel" value={editForm.channel} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Receiver</span>
                <input name="receiver" value={editForm.receiver} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Supplier</span>
                <input name="supplier" value={editForm.supplier} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Transfer Type</span>
                <input name="transferType" value={editForm.transferType} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
              <label className="text-sm">
                <span className="block text-black mb-1">Platform</span>
                <input name="platform" value={editForm.platform} onChange={handleEditChange} className="w-full border border-black text-black rounded px-3 py-2" />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={submitEdit}
                className="flex-1 bg-black text-white py-2 rounded font-semibold hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}