import PurchaseOrder from "../models/PurchaseOrder.js";
import { getTransactionModel } from "../models/Transaction.js";

const sizeKeys = ["s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl"];

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(orderData) {
  try {
    console.log("Creating purchase order with data:", JSON.stringify(orderData, null, 2));
    // Initialize deliveredSizes with empty objects but ensure no dispatch entries are created
    orderData.deliveredSizes = orderData.items?.map(() => ({})) || [];
    const purchaseOrder = new PurchaseOrder(orderData);
    await purchaseOrder.save();
    
    // DO NOT create dispatch entries on PO creation - only when delivered qty is entered
    console.log("Purchase order created - no dispatch entries created yet");
    
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
    console.log("=== UPDATE PURCHASE ORDER START ===");
    console.log("PO ID:", id);
    console.log("Update data:", JSON.stringify(updateData, null, 2));

    const hasDeliveredSizesField = Object.prototype.hasOwnProperty.call(updateData || {}, "deliveredSizes");
    console.log("Has deliveredSizes field:", hasDeliveredSizesField);

    if (hasDeliveredSizesField) {
      updateData.deliveredSizes = normalizeDeliveredSizes(updateData.deliveredSizes);
      console.log("Normalized deliveredSizes:", JSON.stringify(updateData.deliveredSizes, null, 2));
    }

    // Check if there are any actual delivered quantities > 0
    const hasActualDeliveredQty = hasDeliveredSizesField && hasDeliveredQuantities(updateData.deliveredSizes);
    console.log("Has actual delivered qty > 0:", hasActualDeliveredQty);

    // Always delete existing dispatch entries when deliveredSizes field is present
    if (hasDeliveredSizesField) {
      console.log("Deleting existing dispatch entries for PO:", id);
      await deleteDispatchEntriesForPO(id);
    }

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

    console.log("PO updated successfully");

    // Only create dispatch entries if there are actual delivered quantities > 0
    if (hasActualDeliveredQty) {
      console.log("Creating dispatch entries for PO:", id);
      await createDispatchEntriesFromPO(purchaseOrder, updateData?.deliveredSizes);
    } else {
      console.log("Skipping dispatch entry creation - no qty > 0");
    }

    console.log("=== UPDATE PURCHASE ORDER END ===");
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

    console.log(`=== CREATE DISPATCH ENTRIES START for PO ${purchaseOrder._id} ===`);
    console.log("Delivered override:", JSON.stringify(deliveredOverride, null, 2));

    if (!Array.isArray(deliveredOverride)) {
      console.log("deliveredOverride is not an array, exiting");
      console.log("=== CREATE DISPATCH ENTRIES END (no entries created) ===");
      return;
    }

    if (deliveredOverride.length === 0) {
      console.log("deliveredOverride is empty array, exiting");
      console.log("=== CREATE DISPATCH ENTRIES END (no entries created) ===");
      return;
    }

    // Convert delivered sizes from editable delivered qty fields to dispatch transactions
    for (const [index, item] of purchaseOrder.items.entries()) {
      const delivered = deliveredOverride[index] || {};
      console.log(`Item ${index} (${item.designNumber}-${item.color}) delivered:`, JSON.stringify(delivered));
      
      for (const size of sizeKeys) {
        const qty = parseDeliveredQty(delivered[size]);
        if (qty && qty > 0) {
          console.log(`  -> Creating dispatch entry: ${size.toUpperCase()} = ${qty}`);
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
      console.log(`✓ Successfully created ${dispatchEntries.length} dispatch entries for PO ${purchaseOrder._id}`);
    } else {
      console.log(`No dispatch entries to create (all quantities were 0)`);
    }
    console.log("=== CREATE DISPATCH ENTRIES END ===");
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

/**
 * Helper function to check if deliveredSizes contains any quantity > 0
 */
function hasDeliveredQuantities(deliveredSizes) {
  if (!Array.isArray(deliveredSizes)) {
    console.log("hasDeliveredQuantities: Not an array, returning false");
    return false;
  }

  if (deliveredSizes.length === 0) {
    console.log("hasDeliveredQuantities: Empty array, returning false");
    return false;
  }

  for (const [index, item] of deliveredSizes.entries()) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    for (const size of sizeKeys) {
      const qty = parseDeliveredQty(item[size]);
      if (qty > 0) {
        console.log(`hasDeliveredQuantities: Found qty > 0 at item ${index}, size ${size}: ${qty}`);
        return true;
      }
    }
  }

  console.log("hasDeliveredQuantities: No quantities > 0 found, returning false");
  return false;
}
