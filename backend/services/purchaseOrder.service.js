import PurchaseOrder from "../models/PurchaseOrder.js";

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(orderData) {
  try {
    const purchaseOrder = new PurchaseOrder(orderData);
    await purchaseOrder.save();
    return {
      success: true,
      data: purchaseOrder,
      message: "Purchase order created successfully",
    };
  } catch (error) {
    console.error("Error creating purchase order:", error);
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
