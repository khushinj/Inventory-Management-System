import PurchaseOrder from "../models/PurchaseOrder.js";
import { getTransactionModel } from "../models/Transaction.js";

const sizeKeys = ["s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl"];

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(orderData) {
  try {
    console.log("Creating purchase order with data:", JSON.stringify(orderData, null, 2));

    // Extract year from the order date
    const orderDate = new Date(orderData.date);
    const year = orderDate.getFullYear();

    // Find the highest sequence number for this year
    const lastOrder = await PurchaseOrder.findOne({ year })
      .sort({ sequenceNumber: -1 })
      .select('sequenceNumber')
      .lean();

    // Generate next sequence number
    const sequenceNumber = lastOrder ? lastOrder.sequenceNumber + 1 : 1;

    // Format the order number: PO-YYYY-XXX
    const orderNumber = `PO-${year}-${String(sequenceNumber).padStart(3, '0')}`;

    // Add generated fields to order data
    orderData.orderNumber = orderNumber;
    orderData.sequenceNumber = sequenceNumber;
    orderData.year = year;
    orderData.deliveredSizes = orderData.items?.map(() => ({})) || [];

    const purchaseOrder = new PurchaseOrder(orderData);
    await purchaseOrder.save();

    return {
      success: true,
      data: purchaseOrder,
      message: "Purchase order created successfully",
    };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.errors) {
      console.error("Validation errors:", error.errors);
    }
    throw error;
  }
}

/**
 * Get all purchase orders with optional filters
 */
export async function getAllPurchaseOrders(filters = {}) {
  try {
    const query = {};

    // Apply filters
    if (filters.dealerName) {
      query.dealerName = { $regex: filters.dealerName, $options: "i" };
    }
    if (filters.buyerName) {
      query.buyerName = { $regex: filters.buyerName, $options: "i" };
    }
    if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        query.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.date.$lte = new Date(filters.endDate);
      }
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return {
      success: true,
      data: purchaseOrders,
      count: purchaseOrders.length,
    };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
}

/**
 * Get purchase order by ID
 */
export async function getPurchaseOrderById(id) {
  try {
    const purchaseOrder = await PurchaseOrder.findById(id).lean();

    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }

    return {
      success: true,
      data: purchaseOrder,
    };
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    throw error;
  }
}

/**
 * Update purchase order by ID
 */
export async function updatePurchaseOrder(id, updateData) {
  try {
    console.log("Updating PO with data:", JSON.stringify(updateData, null, 2));

    const shouldSyncDispatch = Object.prototype.hasOwnProperty.call(updateData || {}, "deliveredSizes");

    if (shouldSyncDispatch) {
      updateData.deliveredSizes = normalizeDeliveredSizes(updateData.deliveredSizes);
    }

    // Inventory will be updated only when the order is shipped.
    // So do nothing here.

    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }

    console.log("Updated PO deliveredSizes:", JSON.stringify(purchaseOrder.deliveredSizes, null, 2));

    // Dispatch entries will be created when the user clicks the Shipped button.

    return {
      success: true,
      data: purchaseOrder,
      message: "Purchase order updated successfully",
    };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    throw error;
  }
}

/**
 * Delete purchase order by ID
 */
export async function deletePurchaseOrder(id) {
  try {
    // First delete associated dispatch entries
    await deleteDispatchEntriesForPO(id);

    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(id);

    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }

    return {
      success: true,
      message: "Purchase order deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    throw error;
  }
}

/**
 * Get purchase order statistics
 */
export async function getPurchaseOrderStats(filters = {}) {
  try {
    const matchStage = {};

    if (filters.startDate || filters.endDate) {
      matchStage.date = {};
      if (filters.startDate) {
        matchStage.date.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        matchStage.date.$lte = new Date(filters.endDate);
      }
    }

    const stats = await PurchaseOrder.aggregate([
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalQuantity: { $sum: "$totalQuantity" },
          totalGrossAmount: { $sum: "$grossTotal" },
          totalGST: { $sum: "$gstOutput" },
          totalGrandAmount: { $sum: "$grandTotal" },
        },
      },
    ]);

    return {
      success: true,
      data: stats.length > 0 ? stats[0] : {
        totalOrders: 0,
        totalQuantity: 0,
        totalGrossAmount: 0,
        totalGST: 0,
        totalGrandAmount: 0,
      },
    };
  } catch (error) {
    console.error("Error calculating purchase order stats:", error);
    throw error;
  }
}

/**
 * Helper function to create dispatch entries from purchase order
 */
async function createDispatchEntriesFromPO(purchaseOrder, deliveredOverride = null) {
  try {
    const DispatchModel = getTransactionModel("warehouse", "domestic", "dispatch");
    const dispatchEntries = [];

    // Store PO ID in receiver field to track which PO created these entries
    const poReference = `PO_${purchaseOrder._id}`;

    // Size mapping from DB field names to display format (matching frontend format)
    const sizeMapping = {
      's': 'S',
      'm': 'M',
      'l': 'L',
      'xl': 'XL',
      'xxl': 'XXL',
      'xxxl': '3XL',
      'xxxxl': '4XL',
      'xxxxxl': '5XL',
      'xxxxxxl': '6XL'
    };

    console.log(`Creating dispatch entries for PO ${purchaseOrder._id}`);
    console.log("Delivered override:", JSON.stringify(deliveredOverride, null, 2));
    console.log("PO deliveredSizes from DB:", JSON.stringify(purchaseOrder.deliveredSizes, null, 2));

    if (!Array.isArray(deliveredOverride)) {
      return;
    }

    // Convert delivered sizes from editable delivered qty fields to dispatch transactions
    for (const [index, item] of purchaseOrder.items.entries()) {
      const delivered = deliveredOverride[index] || {};
      console.log(`Item ${index} (${item.designNumber}-${item.color}) delivered:`, JSON.stringify(delivered));

      for (const size of sizeKeys) {
        const qty = parseDeliveredQty(delivered[size]);
        if (qty && qty > 0) {
          dispatchEntries.push({
            domain: "warehouse",
            warehouseType: "domestic",
            formType: "dispatch",
            dno: item.designNumber,
            type: "",
            color: item.color,
            size: sizeMapping[size],
            qty: qty,
            date: purchaseOrder.date,
            receiver: poReference,  // Store PO reference for tracking
          });
        }
      }
    }

    // Bulk insert all dispatch entries
    if (dispatchEntries.length > 0) {
      await DispatchModel.insertMany(dispatchEntries);
      console.log(`Created ${dispatchEntries.length} dispatch entries for PO ${purchaseOrder._id}`);
    }
  } catch (error) {
    console.error("Error creating dispatch entries from PO:", error);
    throw error;
  }
}

/**
 * Helper function to delete dispatch entries associated with a purchase order
 */
async function deleteDispatchEntriesForPO(purchaseOrderId) {
  try {
    const DispatchModel = getTransactionModel("warehouse", "domestic", "dispatch");
    const poReference = `PO_${purchaseOrderId}`;

    const result = await DispatchModel.deleteMany({ receiver: poReference });
    console.log(`Deleted ${result.deletedCount} dispatch entries for PO ${purchaseOrderId}`);
  } catch (error) {
    console.error("Error deleting dispatch entries for PO:", error);
    throw error;
  }
}

/**
 * Ship Purchase Order
 * Creates dispatch entries, deducts inventory and marks order as completed.
 */
export async function shipPurchaseOrder(id) {
  try {
    const purchaseOrder = await PurchaseOrder.findById(id);

    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }

    // Prevent shipping twice
    if (purchaseOrder.status === "completed") {
      return {
        success: false,
        message: "Purchase order is already shipped",
      };
    }

    // Create dispatch entries (this deducts inventory)
    await createDispatchEntriesFromPO(
      purchaseOrder,
      purchaseOrder.deliveredSizes
    );

    // Update status
    purchaseOrder.status = "completed";
    await purchaseOrder.save();

    return {
      success: true,
      data: purchaseOrder,
      message: "Purchase order shipped successfully",
    };
  } catch (error) {
    console.error("Error shipping purchase order:", error);
    throw error;
  }
}


function normalizeDeliveredSizes(deliveredSizes) {
  if (!Array.isArray(deliveredSizes)) {
    return [];
  }

  return deliveredSizes.map((item = {}) => {
    const normalized = {};
    for (const key of sizeKeys) {
      normalized[key] = parseDeliveredQty(item?.[key]);
    }
    return normalized;
  });
}

function parseDeliveredQty(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  return 0;
}
