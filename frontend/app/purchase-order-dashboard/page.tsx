"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { FileText, Search, Filter, Eye, X } from "lucide-react";

type PurchaseOrderItem = {
  category: string;
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

const sizeKeys = ["s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl"] as const;
type SizeKey = (typeof sizeKeys)[number];
type SizeBreakdown = Partial<Record<SizeKey, number>>;

type PurchaseOrder = {
  _id: string;
  orderNumber?: string;
  sequenceNumber?: number;
  year?: number;
  dealerName: string;
  buyerName: string;
  date: string;
  deadline?: string;
  city: string;
  status: "pending" | "partially pending" | "completed";
  items: PurchaseOrderItem[];
  deliveredSizes?: SizeBreakdown[];
  totalQuantity: number;
  grossTotal: number;
  gstOutput: number;
  grandTotal: number;
  termsCondition: string;
  createdAt: string;
  updatedAt: string;
};

type StatusFilter = "all" | "pending" | "partially pending" | "completed";

type DeliveredSizeMap = Record<string, Record<number, Record<SizeKey, number>>>;

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [deliveredSizes, setDeliveredSizes] = useState<DeliveredSizeMap>({});
  const deliveredUpdateTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Helper function to get order number with fallback
  const getOrderNumber = (order: PurchaseOrder) => {
    if (order.orderNumber) {
      return order.orderNumber;
    }
    // Fallback to old format if orderNumber doesn't exist
    const year = new Date(order.date).getFullYear();
    const id = order._id.slice(-3).toUpperCase();
    return `PO-${year}-${id}`;
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  useEffect(() => {
    return () => {
      Object.values(deliveredUpdateTimersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  }, []);

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
        const nextDeliveredSizes: DeliveredSizeMap = {};
        ordersWithStatus.forEach((order: PurchaseOrder) => {
          const orderDelivered: Record<number, Record<SizeKey, number>> = {};

          order.items.forEach((_, itemIndex) => {
            const savedSizes = order.deliveredSizes?.[itemIndex] || {};
            const entry = {} as Record<SizeKey, number>;

            sizeKeys.forEach((key) => {
              const savedValue = savedSizes[key];
              entry[key] = typeof savedValue === "number" && savedValue >= 0 ? savedValue : 0;
            });

            orderDelivered[itemIndex] = entry;
          });

          nextDeliveredSizes[order._id] = orderDelivered;
        });
        setDeliveredSizes(nextDeliveredSizes);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getDerivedStatus = (
    order: PurchaseOrder,
    orderDelivered: DeliveredSizeMap[string] = {}
  ): PurchaseOrder["status"] => {
    let anyDelivered = false;
    let allComplete = true;

    order.items.forEach((item, itemIndex) => {
      const deliveredByItem = orderDelivered[itemIndex] || {};
      sizeKeys.forEach((key) => {
        const qty = (item as Record<SizeKey, number>)[key] || 0;
        if (qty <= 0) {
          return;
        }

        const deliveredRaw = deliveredByItem[key];
        const delivered = typeof deliveredRaw === "number" ? deliveredRaw : 0;
        if (delivered > 0) {
          anyDelivered = true;
        }
        if (delivered < qty) {
          allComplete = false;
        }
      });
    });

    if (!anyDelivered) {
      return "pending";
    }

    if (allComplete) {
      return "completed";
    }

    return "partially pending";
  };

  const buildDeliveredSizesArray = (
    order: PurchaseOrder,
    orderDelivered: DeliveredSizeMap[string] = {}
  ): SizeBreakdown[] => {
    return order.items.map((_, itemIndex) => {
      const entry: SizeBreakdown = {};
      const deliveredByItem = orderDelivered[itemIndex] || {};

      sizeKeys.forEach((key) => {
        const value = deliveredByItem[key];
        entry[key] = typeof value === "number" ? value : 0;
      });

      return entry;
    });
  };

  const updatePurchaseOrderData = async (orderId: string, updateData: Partial<PurchaseOrder>) => {
    try {
      console.log("=== updatePurchaseOrderData called ===");
      console.log("Order ID:", orderId);
      console.log("Update data:", JSON.stringify(updateData, null, 2));
      console.log("====================================");
      
      const res = await api.put(`/purchase-order/${orderId}`, updateData);
      if (res.data && res.data.success) {
        const updatedOrder: PurchaseOrder = res.data.data;
        setOrders((prev) =>
          prev.map((order) => (order._id === orderId ? { ...order, ...updatedOrder } : order))
        );
        if (selectedOrder?._id === orderId) {
          setSelectedOrder({ ...selectedOrder, ...updatedOrder });
        }
      }
    } catch (error) {
      console.error("Error updating purchase order:", error);
      alert("Failed to update purchase order");
    }
  };

  const handleDeliveredChange = (
    order: PurchaseOrder,
    itemIndex: number,
    sizeKey: SizeKey,
    value: string
  ) => {
    const parsedValue = Number(value);
    const nextValue = Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0;
    const nextDelivered: DeliveredSizeMap = {
      ...deliveredSizes,
      [order._id]: {
        ...(deliveredSizes[order._id] || {}),
        [itemIndex]: {
          ...((deliveredSizes[order._id] || {})[itemIndex] || {}),
          [sizeKey]: nextValue,
        },
      },
    };

    setDeliveredSizes(nextDelivered);

    const derivedStatus = getDerivedStatus(order, nextDelivered[order._id]);
    const deliveredSizesArray = buildDeliveredSizesArray(order, nextDelivered[order._id]);

    console.log("=== FRONTEND: Prepared deliveredSizesArray to send ===");
    console.log("Item Index:", itemIndex);
    console.log("Size Key:", sizeKey, "Value:", nextValue);
    console.log("Delivered Sizes Array:", JSON.stringify(deliveredSizesArray, null, 2));
    
    // Verify we're sending delivered, not ordered quantities
    order.items.forEach((item, idx) => {
      const deliveredEntry = deliveredSizesArray[idx] || {};
      const orderedQtys: Record<SizeKey, number> = {} as Record<SizeKey, number>;
      const deliveredQtys: Record<SizeKey, number> = {} as Record<SizeKey, number>;
      sizeKeys.forEach(size => {
        orderedQtys[size] = item[size];
        deliveredQtys[size] = deliveredEntry[size] ?? 0;
      });
      console.log(`Item ${idx} (${item.designNumber}): Ordered=${JSON.stringify(orderedQtys)}, Delivered=${JSON.stringify(deliveredQtys)}`);
    });

    const existingTimer = deliveredUpdateTimersRef.current[order._id];
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    deliveredUpdateTimersRef.current[order._id] = setTimeout(() => {
      console.log("=== FRONTEND: Sending update to backend ===");
      console.log("deliveredSizes payload:", JSON.stringify(deliveredSizesArray, null, 2));
      updatePurchaseOrderData(order._id, {
        status: derivedStatus,
        deliveredSizes: deliveredSizesArray,
      });
    }, 300);
  };

  const handleDeliveredKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const currentInput = event.currentTarget;
    const row = currentInput.closest("tr");
    if (!row) {
      return;
    }

    const inputs = Array.from(row.querySelectorAll<HTMLInputElement>("input[data-delivered-input]"));
    const currentIndex = inputs.indexOf(currentInput);
    const nextInput = inputs[currentIndex + 1];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
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
              {/* Status Badge */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {getOrderNumber(order)}
                </h3>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    order.status
                  )}`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
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
                {order.deadline && (
                  <div>
                    <p className="text-gray-500">Deadline</p>
                    <p className="text-red-600 font-medium">{formatDate(order.deadline)}</p>
                  </div>
                )}
                {!order.deadline && (
                  <div>
                    <p className="text-gray-500">City</p>
                    <p className="text-gray-900 font-medium">{order.city}</p>
                  </div>
                )}
              </div>
              
              {order.deadline && (
                <div className="mb-4 text-sm">
                  <p className="text-gray-500">City</p>
                  <p className="text-gray-900 font-medium">{order.city}</p>
                </div>
              )}

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
                  {getOrderNumber(selectedOrder)}
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
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedOrder.items.map((item, index) => {
                          // Get sizes with quantities
                          const sizes = [
                            { label: "S", key: "s", qty: item.s },
                            { label: "M", key: "m", qty: item.m },
                            { label: "L", key: "l", qty: item.l },
                            { label: "XL", key: "xl", qty: item.xl },
                            { label: "XXL", key: "xxl", qty: item.xxl },
                            { label: "3XL", key: "xxxl", qty: item.xxxl },
                            { label: "4XL", key: "xxxxl", qty: item.xxxxl },
                            { label: "5XL", key: "xxxxxl", qty: item.xxxxxl },
                            { label: "6XL", key: "xxxxxxl", qty: item.xxxxxxl },
                          ] as const satisfies ReadonlyArray<{ label: string; key: SizeKey; qty: number }>;
                          const sizeList = sizes.filter((size) => size.qty > 0);

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-sm text-gray-600">{item.designNumber} - {item.color}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-[10px] uppercase tracking-wide text-gray-500">Ordered Qty</p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {sizeList.map(size => (
                                    <span
                                      key={size.label}
                                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium"
                                    >
                                      {size.label}: {size.qty}
                                    </span>
                                  ))}
                                </div>
                                <p className="mt-3 text-[10px] uppercase tracking-wide text-gray-500">Delivered Qty</p>
                                <div className="mt-1 grid grid-cols-3 sm:grid-cols-6 gap-2">
                                  {sizeList.map((size) => {
                                    const deliveredValue =
                                      deliveredSizes[selectedOrder._id]?.[index]?.[size.key] ?? 0;
                                    const deliveredInputValue = deliveredValue === 0 ? "" : deliveredValue;

                                    return (
                                      <label key={size.label} className="flex flex-col text-[10px] text-gray-500">
                                        {size.label}
                                        <input
                                          type="number"
                                          min={0}
                                          inputMode="numeric"
                                          value={deliveredInputValue}
                                          onChange={(event) => 
                                            handleDeliveredChange(
                                              selectedOrder,
                                              index,
                                              size.key as SizeKey,
                                              event.target.value
                                            )
                                          }
                                          onKeyDown={handleDeliveredKeyDown}
                                          data-delivered-input
                                          className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-gray-900">{item.qty}</td>
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
