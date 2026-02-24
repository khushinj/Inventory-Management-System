"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { FileText, Search, Filter, Eye, MoreVertical, X } from "lucide-react";

type PurchaseOrderItem = {
  category: string;
  itemName: string;
  designNumber: string;
  color: string;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
  xxxl: number;
  xxxxl: number;
  xxxxxl: number;
  xxxxxxl: number;
  qty: number;
  mrp: number;
  dis: number;
  rate: number;
  amount: number;
  tgst: number;
  tax: number;
  amt: number;
};

type PurchaseOrder = {
  _id: string;
  dealerName: string;
  buyerName: string;
  date: string;
  city: string;
  status: "pending" | "partially pending" | "completed";
  items: PurchaseOrderItem[];
  totalQuantity: number;
  grossTotal: number;
  gstOutput: number;
  grandTotal: number;
  termsCondition: string;
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = "all" | "pending" | "partially pending" | "completed";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside any dropdown menu
      if (!target.closest('.status-dropdown-menu') && !target.closest('.status-menu-button')) {
        setActiveMenu(null);
      }
    };

    if (activeMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeMenu]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/purchase-order");
      if (res.data && res.data.success) {
        // Add default status for orders that don't have one
        const ordersWithStatus = res.data.data.map((order: PurchaseOrder) => ({
          ...order,
          status: order.status || "pending",
        }));
        setOrders(ordersWithStatus);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.dealerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.buyerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getStatusCounts = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "pending").length,
      partiallyPending: orders.filter((o) => o.status === "partially pending").length,
      completed: orders.filter((o) => o.status === "completed").length,
    };
  };

  const getTotalOrderValue = () => {
    return orders.reduce((sum, order) => sum + order.grandTotal, 0);
  };

  const updateOrderStatus = async (orderId: string, newStatus: "pending" | "partially pending" | "completed") => {
    try {
      const res = await api.put(`/purchase-order/${orderId}`, { status: newStatus });
      if (res.data && res.data.success) {
        // Update local state
        setOrders(orders.map((order) => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        setActiveMenu(null);
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "partially pending":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const stats = getStatusCounts();
  const totalValue = getTotalOrderValue();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchase orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
        </div>
        <p className="text-gray-600">View and manage all client purchase orders</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Partially Pending</p>
          <p className="text-3xl font-bold text-purple-600">{stats.partiallyPending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Total Order Value */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-700 text-sm mb-1">Total Order Value</p>
            <p className="text-4xl font-bold text-blue-900">{formatCurrency(totalValue)}</p>
          </div>
          <FileText className="w-16 h-16 text-blue-300" />
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
          <input
            type="text"
            placeholder="Search by order number, client name, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="pl-10 pr-8 text-black py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white cursor-pointer min-w-[200px]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="partially pending">Partially Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-gray-600 mb-4">
        Showing {filteredOrders.length} of {orders.length} orders
      </p>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "No purchase orders have been created yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6 relative"
            >
              {/* Status Badge and Menu */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    PO-{new Date(order.date).getFullYear()}-{order._id.slice(-3).toUpperCase()}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === order._id ? null : order._id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors status-menu-button"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {activeMenu === order._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 status-dropdown-menu">
                      <div className="py-1">
                        <button
                          onClick={() => updateOrderStatus(order._id, "pending")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                          Pending
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order._id, "partially pending")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                          Partially Pending
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order._id, "completed")}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                        >
                          <span className="w-3 h-3 rounded-full bg-green-500"></span>
                          Completed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              <div className="mb-4">
                <p className="text-lg font-semibold text-gray-900">{order.buyerName}</p>
                <p className="text-sm text-gray-600">{order.dealerName}</p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Order Date</p>
                  <p className="text-gray-900 font-medium">{formatDate(order.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">City</p>
                  <p className="text-gray-900 font-medium">{order.city}</p>
                </div>
              </div>

              {/* Amount and Items */}
              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 text-sm">Total Amount</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(order.grandTotal)}</span>
                </div>
                <p className="text-sm text-gray-600">{order.items.length} items</p>
              </div>

              {/* View Details Button */}
              <button 
                onClick={() => setSelectedOrder(order)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-black border rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  PO-{new Date(selectedOrder.date).getFullYear()}-{selectedOrder._id.slice(-3).toUpperCase()}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Purchase order details and item breakdown</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Client Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Client Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Client Name</p>
                    <p className="text-base font-semibold text-gray-900">{selectedOrder.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="text-base font-semibold text-gray-900">{selectedOrder.dealerName}</p>
                  </div>
                </div>
              </div>

              {/* Order Timeline */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Order Timeline</h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="text-base font-semibold text-gray-900">{formatDate(selectedOrder.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">City</p>
                    <p className="text-base font-semibold text-gray-900">{selectedOrder.city}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Order Items</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Product Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Size Breakdown
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Total Qty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => {
                          // Get sizes with quantities
                          const sizes = [
                            { label: 'S', qty: item.s },
                            { label: 'M', qty: item.m },
                            { label: 'L', qty: item.l },
                            { label: 'XL', qty: item.xl },
                            { label: 'XXL', qty: item.xxl },
                            { label: '3XL', qty: item.xxxl },
                            { label: '4XL', qty: item.xxxxl },
                            { label: '5XL', qty: item.xxxxxl },
                            { label: '6XL', qty: item.xxxxxxl },
                          ].filter(size => size.qty > 0);

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-medium text-gray-900">{item.itemName}</p>
                                  <p className="text-sm text-gray-600">{item.designNumber} - {item.color}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {sizes.map(size => (
                                    <span
                                      key={size.label}
                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                                    >
                                      {size.label}: {size.qty}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-gray-900">{item.qty}</td>
                              <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item.rate)}</td>
                              <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(item.amt)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount</span>
                  <span className="text-3xl font-bold text-blue-900">{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600 flex justify-between">
                  <span>Gross Total: {formatCurrency(selectedOrder.grossTotal)}</span>
                  <span>GST: {formatCurrency(selectedOrder.gstOutput)}</span>
                </div>
              </div>

              {/* Notes/Terms */}
              {selectedOrder.termsCondition && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedOrder.termsCondition}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
