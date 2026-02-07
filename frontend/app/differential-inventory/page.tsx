"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";

type WarehouseSummary = {
  warehouseType: string;
  totalSKUs: number;
  totalInbound: number;
  totalOutbound: number;
  totalStock: number;
};

type DesignInventory = {
  dno: string;
  color: string;
  size: string;
  stock: number;
  inbound: number;
  outbound: number;
};

export default function DifferentialInventoryPage() {
  const [activeTab, setActiveTab] = useState<"domestic" | "export" | "online">("domestic");
  const [summary, setSummary] = useState<WarehouseSummary | null>(null);
  const [items, setItems] = useState<DesignInventory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<DesignInventory[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [threshold, setThreshold] = useState(10);

  useEffect(() => {
    fetchInventory();
  }, [activeTab]);

  const fetchInventory = async () => {
    try {
      setLoading(true);

      // Fetch summary
      const summaryRes = await api.get(`/inventory/warehouse/${activeTab}/summary`);
      setSummary(summaryRes.data);
      setItems(summaryRes.data.items || []);

      // Fetch low stock items
      const lowStockRes = await api.get(
        `/inventory/warehouse/${activeTab}/low-stock?threshold=${threshold}`
      );
      setLowStockItems(lowStockRes.data.items || []);

      // Fetch comparison for first design (optional)
      if (summaryRes.data.items?.length > 0) {
        const firstDno = summaryRes.data.items[0].dno;
        const comparisonRes = await api.get(`/inventory/design/${firstDno}`);
        setComparison(comparisonRes.data);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock > threshold) return { color: 'text-green-600', bg: 'bg-green-50', label: 'Good' };
    if (stock > 0) return { color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Low' };
    return { color: 'text-red-600', bg: 'bg-red-50', label: 'Out' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold">Differential Inventory</h1>
          <p className="mt-1 text-indigo-100">Track inventory separately across warehouses</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warehouse Tabs */}
        <div className="flex gap-4 mb-8">
          {(['domestic', 'export', 'online'] as const).map((warehouse) => (
            <button
              key={warehouse}
              onClick={() => setActiveTab(warehouse)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === warehouse
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {warehouse.charAt(0).toUpperCase() + warehouse.slice(1)} Warehouse
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            <p className="mt-4 text-gray-600">Loading inventory...</p>
          </div>
        ) : summary ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-gray-600 text-sm font-medium">Total SKUs</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{summary.totalSKUs}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-gray-600 text-sm font-medium">Total Inbound</div>
                <div className="text-3xl font-bold text-green-600 mt-2">{summary.totalInbound}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-gray-600 text-sm font-medium">Total Outbound</div>
                <div className="text-3xl font-bold text-red-600 mt-2">{summary.totalOutbound}</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-gray-600 text-sm font-medium">Available Stock</div>
                <div className="text-3xl font-bold text-blue-600 mt-2">{summary.totalStock}</div>
              </div>
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-lg font-semibold text-yellow-900">Low Stock Alert</h3>
                </div>
                <p className="text-yellow-800 text-sm mb-4">
                  {lowStockItems.length} items with stock below {threshold} units
                </p>
              </div>
            )}

            {/* Inventory Items Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Inventory Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Design №</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Color</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Size</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Inbound</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Outbound</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Stock</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.slice(0, 50).map((item, idx) => {
                      const status = getStockStatus(item.stock);
                      return (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.dno}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.color}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.size}</td>
                          <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">{item.inbound}</td>
                          <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">{item.outbound}</td>
                          <td className={`px-6 py-4 text-sm text-right font-semibold ${status.color}`}>
                            {item.stock}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {items.length > 50 && (
                <div className="px-6 py-4 bg-gray-50 text-center text-sm text-gray-600">
                  Showing 50 of {items.length} items
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
