"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "../lib/api";

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterChannel, setFilterChannel] = useState("All Channels");
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory Dashboard</h1>
        <p className="text-gray-600">Track and manage your inventory entries</p>
      </div>

      {/* Search & Controls */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search entries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border px-4 py-2 rounded"
        />
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option>All Channels</option>
          <option>Retail</option>
          <option>Online</option>
          <option>Export</option>
        </select>
        <Link href="/forms">
          <button className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700">
            + Add Row
          </button>
        </Link>
        <button className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700">
          ⬇ Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded p-6">
          <p className="text-gray-600 text-sm mb-2">Total Entries</p>
          <p className="text-3xl font-bold">{entries.length}</p>
        </div>
        <div className="bg-white border rounded p-6">
          <p className="text-gray-600 text-sm mb-2">Total Quantity</p>
          <p className="text-3xl font-bold">{totalQty}</p>
        </div>
        <div className="bg-white border rounded p-6">
          <p className="text-gray-600 text-sm mb-2">Online vs Retail</p>
          <p className="text-3xl font-bold">
            {onlineCount} / {retailCount}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
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
                <tr key={entry._id} className="border-b hover:bg-gray-50">
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
                  <td className="p-4 bg-blue-50 rounded">{entry.qty}</td>
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
                  <td className="p-4 text-blue-600 cursor-pointer hover:underline">
                    Edit
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}