"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { FileText, Search, Filter, Eye, X, Trash2, Edit, Truck, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { generatePurchaseOrderPdf } from "../../lib/pdf-for-purchase-order";

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
  poc?: string;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [deliveredSizes, setDeliveredSizes] = useState<DeliveredSizeMap>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PurchaseOrder>>({});
  const [editSaveStatus, setEditSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
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

  const cloneItems = (items: PurchaseOrderItem[]) =>
    items.map((item) => ({
      ...item,
      category: item.category || "",
      designNumber: item.designNumber || "",
      color: item.color || "",
      s: item.s || 0,
      m: item.m || 0,
      l: item.l || 0,
      xl: item.xl || 0,
      xxl: item.xxl || 0,
      xxxl: item.xxxl || 0,
      xxxxl: item.xxxxl || 0,
      xxxxxl: item.xxxxxl || 0,
      xxxxxxl: item.xxxxxxl || 0,
      qty: item.qty || 0,
      mrp: item.mrp || 0,
      dis: item.dis || 0,
      rate: item.rate || 0,
      amount: item.amount || 0,
      tgst: item.tgst || 0,
      tax: item.tax || 0,
      amt: item.amt || 0,
    }));

  const toDeliveredArray = (order: PurchaseOrder): SizeBreakdown[] => {
    return order.items.map((_, itemIndex) => {
      const savedSizes = deliveredSizes[order._id]?.[itemIndex] || order.deliveredSizes?.[itemIndex] || {};
      const entry: SizeBreakdown = {};
      sizeKeys.forEach((key) => {
        const value = savedSizes[key];
        entry[key] = typeof value === "number" && value >= 0 ? value : 0;
      });
      return entry;
    });
  };

  const recalculateOrderTotals = (items: PurchaseOrderItem[]) => {
    const totalQuantity = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const grossTotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const gstOutput = items.reduce((sum, item) => sum + (item.tax || 0), 0);
    const grandTotal = items.reduce((sum, item) => sum + (item.amt || 0), 0);

    return { totalQuantity, grossTotal, gstOutput, grandTotal };
  };

  const recalculateItem = (item: PurchaseOrderItem): PurchaseOrderItem => {
    const qty = sizeKeys.reduce((sum, sizeKey) => sum + (((item as Record<SizeKey, number>)[sizeKey] || 0)), 0);
    const mrp = Number(item.mrp || 0);
    const dis = Number(item.dis || 0);
    const tgst = Number(item.tgst || 0);
    const rate = Number((mrp - (mrp * dis) / 100).toFixed(2));
    const amount = Number((qty * rate).toFixed(2));
    const tax = Number((amount * (tgst / 100)).toFixed(2));
    const amt = Number((amount + tax).toFixed(2));

    return {
      ...item,
      qty,
      rate,
      amount,
      tax,
      amt,
    };
  };

  const openEditModal = (order: PurchaseOrder) => {
    setEditingOrder(order);
    setEditFormData({
      status: order.status,
      dealerName: order.dealerName,
      buyerName: order.buyerName,
      poc: order.poc || "",
      date: new Date(order.date).toISOString().split('T')[0],
      deadline: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : '',
      city: order.city,
      termsCondition: order.termsCondition,
      items: cloneItems(order.items),
      deliveredSizes: toDeliveredArray(order),
      totalQuantity: order.totalQuantity,
      grossTotal: order.grossTotal,
      gstOutput: order.gstOutput,
      grandTotal: order.grandTotal,
    });
    setEditSaveStatus("idle");
  };

  const closeEditModal = () => {
    setEditingOrder(null);
    setEditFormData({});
    setEditSaveStatus("idle");
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditItemChange = (
    itemIndex: number,
    field: keyof PurchaseOrderItem,
    value: string
  ) => {
    setEditFormData((prev) => {
      const currentItems = cloneItems((prev.items as PurchaseOrderItem[]) || editingOrder?.items || []);
      const existingItem = currentItems[itemIndex];
      if (!existingItem) {
        return prev;
      }

      const numericFields: Array<keyof PurchaseOrderItem> = [
        "s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl",
        "qty", "mrp", "dis", "rate", "amount", "tgst", "tax", "amt",
      ];

      const parsedValue = numericFields.includes(field)
        ? Math.max(0, Number(value) || 0)
        : value;

      const updatedItem = { ...existingItem, [field]: parsedValue } as PurchaseOrderItem;

      const shouldAutoRecalculate =
        field === "s" ||
        field === "m" ||
        field === "l" ||
        field === "xl" ||
        field === "xxl" ||
        field === "xxxl" ||
        field === "xxxxl" ||
        field === "xxxxxl" ||
        field === "xxxxxxl" ||
        field === "mrp" ||
        field === "dis" ||
        field === "tgst";

      currentItems[itemIndex] = shouldAutoRecalculate ? recalculateItem(updatedItem) : updatedItem;

      const totals = recalculateOrderTotals(currentItems);

      return {
        ...prev,
        items: currentItems,
        totalQuantity: totals.totalQuantity,
        grossTotal: totals.grossTotal,
        gstOutput: totals.gstOutput,
        grandTotal: totals.grandTotal,
      };
    });
  };

  const handleEditDeliveredChange = (itemIndex: number, sizeKey: SizeKey, value: string) => {
    setEditFormData((prev) => {
      const currentDelivered = Array.isArray(prev.deliveredSizes)
        ? [...prev.deliveredSizes]
        : toDeliveredArray(editingOrder as PurchaseOrder);

      const itemDelivered = { ...(currentDelivered[itemIndex] || {}) };
      const parsed = Math.max(0, Number(value) || 0);
      itemDelivered[sizeKey] = parsed;
      currentDelivered[itemIndex] = itemDelivered;

      return {
        ...prev,
        deliveredSizes: currentDelivered,
      };
    });
  };

  const handleEditFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setEditSaveStatus("saving");

      // Prepare the update data with proper date formatting
      const updateData: Partial<PurchaseOrder> = {
        status: (editFormData.status as PurchaseOrder["status"]) || editingOrder.status,
        dealerName: editFormData.dealerName || editingOrder.dealerName,
        buyerName: editFormData.buyerName || editingOrder.buyerName,
        poc: typeof editFormData.poc === "string" ? editFormData.poc : (editingOrder.poc || ""),
        date: editFormData.date ? new Date(editFormData.date).toISOString() : editingOrder.date,
        deadline: editFormData.deadline ? new Date(editFormData.deadline).toISOString() : editingOrder.deadline,
        city: editFormData.city || editingOrder.city,
        termsCondition: editFormData.termsCondition !== undefined ? editFormData.termsCondition : editingOrder.termsCondition,
        items: Array.isArray(editFormData.items) ? cloneItems(editFormData.items as PurchaseOrderItem[]) : editingOrder.items,
        deliveredSizes: Array.isArray(editFormData.deliveredSizes)
          ? (editFormData.deliveredSizes as SizeBreakdown[])
          : toDeliveredArray(editingOrder),
        totalQuantity: typeof editFormData.totalQuantity === "number" ? editFormData.totalQuantity : editingOrder.totalQuantity,
        grossTotal: typeof editFormData.grossTotal === "number" ? editFormData.grossTotal : editingOrder.grossTotal,
        gstOutput: typeof editFormData.gstOutput === "number" ? editFormData.gstOutput : editingOrder.gstOutput,
        grandTotal: typeof editFormData.grandTotal === "number" ? editFormData.grandTotal : editingOrder.grandTotal,
      };

      const res = await api.put(`/purchase-order/${editingOrder._id}`, updateData);
      if (res.data && res.data.success) {
        const updatedOrder: PurchaseOrder = res.data.data;
        setOrders((prev) =>
          prev.map((order) => (order._id === editingOrder._id ? updatedOrder : order))
        );
        if (selectedOrder?._id === editingOrder._id) {
          setSelectedOrder(updatedOrder);
        }
        setDeliveredSizes((prev) => {
          const orderDelivered: Record<number, Record<SizeKey, number>> = {};
          updatedOrder.items.forEach((_, itemIndex) => {
            const delivered = updatedOrder.deliveredSizes?.[itemIndex] || {};
            const entry = {} as Record<SizeKey, number>;
            sizeKeys.forEach((key) => {
              const value = delivered[key];
              entry[key] = typeof value === "number" && value >= 0 ? value : 0;
            });
            orderDelivered[itemIndex] = entry;
          });

          return {
            ...prev,
            [updatedOrder._id]: orderDelivered,
          };
        });
        setEditSaveStatus("saved");
        setTimeout(() => {
          closeEditModal();
        }, 1200);
      }
    } catch (error) {
      console.error("Error updating purchase order:", error);
      setEditSaveStatus("error");
      setTimeout(() => setEditSaveStatus("idle"), 2000);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    const roleMatch = document.cookie.match(/(?:^|; )ims_user_role=([^;]+)/);
    setIsAdmin(roleMatch?.[1] === "admin");
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
          order.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.poc || "").toLowerCase().includes(searchTerm.toLowerCase())
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

  const downloadExcel = () => {
    const groupedRows = new Map<
      string,
      {
        designNumber: string;
        purchaseOrderNumbers: Set<string>;
        pending: number;
        delivered: number;
        undelivered: number;
      }
    >();

    filteredOrders.forEach((order) => {
      const orderDelivered = deliveredSizes[order._id] || {};

      order.items.forEach((item, itemIndex) => {
        const designNumber = item.designNumber || "-";
        const pending = Number(item.qty || 0);
        const deliveredByItem = orderDelivered[itemIndex] || order.deliveredSizes?.[itemIndex] || {};
        const delivered = sizeKeys.reduce((sum, key) => {
          const value = deliveredByItem[key];
          return sum + (typeof value === "number" && value > 0 ? value : 0);
        }, 0);
        const normalizedDelivered = Math.min(delivered, pending);
        const undelivered = Math.max(pending - normalizedDelivered, 0);

        if (!groupedRows.has(designNumber)) {
          groupedRows.set(designNumber, {
            designNumber,
            purchaseOrderNumbers: new Set<string>(),
            pending: 0,
            delivered: 0,
            undelivered: 0,
          });
        }

        const row = groupedRows.get(designNumber)!;
        row.purchaseOrderNumbers.add(getOrderNumber(order));
        row.pending += pending;
        row.delivered += normalizedDelivered;
        row.undelivered += undelivered;
      });
    });

    const excelData = Array.from(groupedRows.values()).map((row) => ({
      "Design Number": row.designNumber,
      "Purchase Order Numbers": Array.from(row.purchaseOrderNumbers).join(", ") || "-",
      "Pending Quantity": row.pending,
      Delivered: row.delivered,
      Undelivered: row.undelivered,
    }));

    if (excelData.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase Orders");

    const fileName = `Purchase_Orders_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getDerivedStatus = (
    order: PurchaseOrder,
    orderDelivered: DeliveredSizeMap[string] = {}
  ): PurchaseOrder["status"] => {
    // if (order.status === "completed") {
    //   return "completed";
    // }

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

    if (order.status === "completed") {
      return "completed";
    }

    if (!anyDelivered) {
      return "pending";
    }

    return "partially pending";
  };

  const handleMarkAsShipped = async (order: PurchaseOrder) => {
    const confirmed = window.confirm(
      `Mark ${getOrderNumber(order)} as shipped?`
    );

    if (!confirmed) return;

    try {
      const res = await api.post(`/purchase-order/${order._id}/ship`);

      if (res.data.success) {
        generatePurchaseOrderPdf({
          headerInfo: {
            dealerName: order.dealerName,
            buyerName: order.buyerName,
            poc: order.poc || "",
            date: order.date,
            deadline: order.deadline || "",
            city: order.city,
          },
          items: order.items,
          deliveredSizes: res.data.data.deliveredSizes,
          summary: {
            totalQuantity: order.totalQuantity,
            grossTotal: order.grossTotal,
            purchaseOrderValueWords: "",
            gstOutput: order.gstOutput,
            grandTotal: order.grandTotal,
            termsCondition: order.termsCondition,
          },
        });

        await fetchPurchaseOrders();

        if (selectedOrder?._id === order._id) {
          setSelectedOrder(res.data.data);
        }

        alert("Purchase order shipped successfully.");
      }
    } catch (error) {
      console.error("Error marking purchase order as shipped:", error);
      alert("Failed to mark purchase order as shipped");
    }
  };

  const getOrderCompletion = (
    order: PurchaseOrder,
    orderDelivered: DeliveredSizeMap[string] = {}
  ) => {
    let orderedQuantity = 0;
    let deliveredQuantity = 0;

    order.items.forEach((item, itemIndex) => {
      const deliveredByItem = orderDelivered[itemIndex] || {};

      sizeKeys.forEach((key) => {
        const ordered = (item as Record<SizeKey, number>)[key] || 0;
        if (ordered <= 0) {
          return;
        }

        const deliveredRaw = deliveredByItem[key];
        const delivered = typeof deliveredRaw === "number" ? deliveredRaw : 0;

        orderedQuantity += ordered;
        deliveredQuantity += Math.min(Math.max(delivered, 0), ordered);
      });
    });

    const completionPercentage =
      orderedQuantity > 0 ? Math.round((deliveredQuantity / orderedQuantity) * 100) : 0;

    return {
      orderedQuantity,
      deliveredQuantity,
      completionPercentage,
    };
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
      throw error;
    }
  };

  const handleManualSave = async () => {
    if (!selectedOrder) return;

    try {
      setSaveStatus("saving");

      const existingTimer = deliveredUpdateTimersRef.current[selectedOrder._id];
      if (existingTimer) {
        clearTimeout(existingTimer);
        delete deliveredUpdateTimersRef.current[selectedOrder._id];
      }

      const derivedStatus = getDerivedStatus(selectedOrder, deliveredSizes[selectedOrder._id]);
      const deliveredSizesArray = buildDeliveredSizesArray(selectedOrder, deliveredSizes[selectedOrder._id]);

      await updatePurchaseOrderData(selectedOrder._id, {
        status: derivedStatus,
        deliveredSizes: deliveredSizesArray,
      });

      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Error saving purchase order:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleDeleteOrder = async (order: PurchaseOrder) => {
    const confirmed = window.confirm(
      `Delete ${getOrderNumber(order)} for ${order.buyerName}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/purchase-order/${order._id}`);

      const existingTimer = deliveredUpdateTimersRef.current[order._id];
      if (existingTimer) {
        clearTimeout(existingTimer);
        delete deliveredUpdateTimersRef.current[order._id];
      }

      setOrders((prev) => prev.filter((current) => current._id !== order._id));
      setDeliveredSizes((prev) => {
        const next = { ...prev };
        delete next[order._id];
        return next;
      });

      if (selectedOrder?._id === order._id) {
        setSelectedOrder(null);
        setSaveStatus("idle");
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Error deleting purchase order:", error);
      alert("Failed to delete purchase order");
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
    setHasUnsavedChanges(true);

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

  const getStatCardClassName = (filterValue: StatusFilter) => {
    const isActive = statusFilter === filterValue;

    return `bg-white rounded-lg shadow p-6 text-left transition-all ${isActive
      ? "ring-2 ring-blue-500 shadow-md"
      : "hover:shadow-md hover:-translate-y-0.5"
      }`;
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
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={getStatCardClassName("all")}
        >
          <p className="text-gray-600 text-sm mb-1">Total Orders</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={getStatCardClassName("pending")}
        >
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("partially pending")}
          className={getStatCardClassName("partially pending")}
        >
          <p className="text-gray-600 text-sm mb-1">Partially Pending</p>
          <p className="text-3xl font-bold text-purple-600">{stats.partiallyPending}</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("completed")}
          className={getStatCardClassName("completed")}
        >
          <p className="text-gray-600 text-sm mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
        </button>
      </div>

      {/* Total Order Value (Admin Only) */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 text-sm mb-1">Total Order Value</p>
              <p className="text-4xl font-bold text-blue-900">{formatCurrency(totalValue)}</p>
            </div>
            <FileText className="w-16 h-16 text-blue-300" />
          </div>
        </div>
      )}

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
        <button
          type="button"
          onClick={downloadExcel}
          disabled={filteredOrders.length === 0}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Download className="w-4 h-4" />
          Export to Excel
        </button>
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
          {filteredOrders.map((order) => {
            const completion = getOrderCompletion(order, deliveredSizes[order._id]);
            const cardStatus = getDerivedStatus(order, deliveredSizes[order._id]);

            return (
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
                      cardStatus
                    )}`}
                  >
                    {cardStatus.charAt(0).toUpperCase() + cardStatus.slice(1)}
                  </span>
                </div>

                {/* Client Info */}
                <div className="mb-4">
                  <p className="text-lg font-semibold text-gray-900">{order.buyerName}</p>
                  <p className="text-sm text-gray-600">{order.dealerName}</p>
                  <p className="text-sm text-gray-500">POC: {order.poc || "-"}</p>
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
                  <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-gray-500">Completed</span>
                      <span className="font-semibold text-gray-900">{completion.completionPercentage}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-300"
                        style={{ width: `${completion.completionPercentage}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      {completion.deliveredQuantity} of {completion.orderedQuantity} qty delivered
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {(cardStatus === "partially pending" || cardStatus === "completed") && (
                    <button
                      onClick={() => {
                        if (cardStatus !== "completed") {
                          handleMarkAsShipped(order);
                        }
                      }}
                      disabled={cardStatus === "completed"}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${cardStatus === "completed"
                          ? "bg-green-600 text-white cursor-default"
                          : "text-green-700 border border-green-300 hover:bg-green-50"
                        }`}
                    >
                      <Truck className="w-4 h-4" />
                      {cardStatus === "completed" ? "Shipped" : "Ship"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setSaveStatus("idle");
                      setHasUnsavedChanges(false);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-2 py-2 text-black border rounded-lg transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <button
                    onClick={() => openEditModal(order)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order)}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
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
                <button
                  onClick={handleManualSave}
                  disabled={!hasUnsavedChanges || saveStatus === "saving"}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${saveStatus === "saved"
                    ? "bg-green-100 text-green-800"
                    : saveStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : saveStatus === "saving"
                        ? "bg-blue-100 text-blue-800"
                        : hasUnsavedChanges
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {saveStatus === "saving" && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  )}
                  {saveStatus === "saved" && <span>✓</span>}
                  {saveStatus === "error" && <span>✗</span>}
                  {saveStatus === "idle" && hasUnsavedChanges && <span>💾</span>}
                  {saveStatus === "idle" && !hasUnsavedChanges && <span>✓</span>}
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : saveStatus === "error" ? "Error" : "Save"}
                </button>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                </span>
                <button
                  onClick={() => {
                    setSelectedOrder(null);
                    setSaveStatus("idle");
                    setHasUnsavedChanges(false);
                  }}
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
                  <div>
                    <p className="text-sm text-gray-600">POC</p>
                    <p className="text-base font-semibold text-gray-900">{selectedOrder.poc || "-"}</p>
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
                            Purchase Order No.
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
                                <p className="text-sm font-medium text-gray-900">{getOrderNumber(selectedOrder)}</p>
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

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Edit {getOrderNumber(editingOrder)}
                </h2>
                <p className="text-sm text-gray-600 mt-1">Update purchase order details</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleEditFormSubmit} className="p-6">
              <div className="space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={(editFormData.status as PurchaseOrder["status"]) || "pending"}
                    onChange={(e) => handleEditFormChange("status", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="partially pending">Partially Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Dealer Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company/Dealer Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.dealerName || ""}
                    onChange={(e) => handleEditFormChange("dealerName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Buyer Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client/Buyer Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.buyerName || ""}
                    onChange={(e) => handleEditFormChange("buyerName", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* POC */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    POC (Point of Contact)
                  </label>
                  <input
                    type="text"
                    value={editFormData.poc || ""}
                    onChange={(e) => handleEditFormChange("poc", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter POC name"
                  />
                </div>

                {/* Order Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    value={editFormData.date || ""}
                    onChange={(e) => handleEditFormChange("date", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={editFormData.deadline || ""}
                    onChange={(e) => handleEditFormChange("deadline", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={editFormData.city || ""}
                    onChange={(e) => handleEditFormChange("city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Terms & Conditions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={editFormData.termsCondition || ""}
                    onChange={(e) => handleEditFormChange("termsCondition", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Order Items */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Items (Editable)
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[360px]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700">Design</th>
                            <th className="px-3 py-2 text-left text-gray-700">PO No.</th>
                            <th className="px-3 py-2 text-left text-gray-700">Color</th>
                            <th className="px-3 py-2 text-left text-gray-700">Sizes</th>
                            <th className="px-3 py-2 text-left text-gray-700">MRP</th>
                            <th className="px-3 py-2 text-left text-gray-700">Dis%</th>
                            <th className="px-3 py-2 text-left text-gray-700">GST%</th>
                            <th className="px-3 py-2 text-left text-gray-700">Qty</th>
                            <th className="px-3 py-2 text-left text-gray-700">Amt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {((editFormData.items as PurchaseOrderItem[]) || []).map((item, itemIndex) => (
                            <tr key={itemIndex} className="align-top">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.designNumber || ""}
                                  onChange={(e) => handleEditItemChange(itemIndex, "designNumber", e.target.value)}
                                  className="w-36 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                />
                              </td>
                              <td className="px-3 py-2 text-gray-700 font-medium">
                                {getOrderNumber(editingOrder as PurchaseOrder)}
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={item.color || ""}
                                  onChange={(e) => handleEditItemChange(itemIndex, "color", e.target.value)}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <div className="grid grid-cols-3 gap-1 min-w-[210px]">
                                  {sizeKeys.map((sizeKey) => (
                                    <label key={sizeKey} className="text-[10px] text-gray-600 uppercase">
                                      {sizeKey}
                                      <input
                                        type="number"
                                        min={0}
                                        value={(item as Record<SizeKey, number>)[sizeKey] ?? 0}
                                        onChange={(e) => handleEditItemChange(itemIndex, sizeKey as keyof PurchaseOrderItem, e.target.value)}
                                        className="mt-0.5 w-full px-1.5 py-1 border border-gray-300 rounded text-xs text-gray-900"
                                      />
                                    </label>
                                  ))}
                                </div>
                                <p className="mt-2 text-[10px] uppercase tracking-wide text-gray-500">Delivered Qty</p>
                                <div className="mt-1 grid grid-cols-3 gap-1 min-w-[210px]">
                                  {sizeKeys.map((sizeKey) => {
                                    const delivered =
                                      ((editFormData.deliveredSizes as SizeBreakdown[]) || [])[itemIndex]?.[sizeKey] ?? 0;
                                    return (
                                      <label key={`delivered-${sizeKey}`} className="text-[10px] text-gray-600 uppercase">
                                        {sizeKey}
                                        <input
                                          type="number"
                                          min={0}
                                          value={delivered}
                                          onChange={(e) => handleEditDeliveredChange(itemIndex, sizeKey, e.target.value)}
                                          className="mt-0.5 w-full px-1.5 py-1 border border-gray-300 rounded text-xs text-gray-900"
                                        />
                                      </label>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.mrp || 0}
                                  onChange={(e) => handleEditItemChange(itemIndex, "mrp", e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.dis || 0}
                                  onChange={(e) => handleEditItemChange(itemIndex, "dis", e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min={0}
                                  value={item.tgst || 0}
                                  onChange={(e) => handleEditItemChange(itemIndex, "tgst", e.target.value)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-gray-900"
                                />
                              </td>
                              <td className="px-3 py-2 text-gray-900 font-medium">{item.qty || 0}</td>
                              <td className="px-3 py-2 text-gray-900 font-semibold">{formatCurrency(item.amt || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-600">Total Qty</p>
                    <p className="text-lg font-semibold text-gray-900">{editFormData.totalQuantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Gross Total</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(editFormData.grossTotal || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">GST Total</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(editFormData.gstOutput || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Grand Total</p>
                    <p className="text-lg font-semibold text-blue-900">{formatCurrency(editFormData.grandTotal || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaveStatus === "saving"}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${editSaveStatus === "saved"
                    ? "bg-green-100 text-green-800"
                    : editSaveStatus === "error"
                      ? "bg-red-100 text-red-800"
                      : editSaveStatus === "saving"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                  {editSaveStatus === "saving" && (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  )}
                  {editSaveStatus === "saved" && <span>✓</span>}
                  {editSaveStatus === "error" && <span>✗</span>}
                  {editSaveStatus === "saving" ? "Saving..." : editSaveStatus === "saved" ? "Saved!" : editSaveStatus === "error" ? "Error" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
