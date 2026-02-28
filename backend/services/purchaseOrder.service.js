import PurchaseOrder from "../models/PurchaseOrder.js";
import { getTransactionModel } from "../models/Transaction.js";

const sizeKeys = ["s", "m", "l", "xl", "xxl", "xxxl", "xxxxl", "xxxxxl", "xxxxxxl"];

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(orderData) {
  try {
    console.log("Creating purchase order with data:", JSON.stringify(orderData, null, 2));
    
    // Initialize deliveredSizes with explicit zeros for all sizes to prevent auto-population
    // This ensures dispatch entries are NEVER created on PO creation
    orderData.deliveredSizes = orderData.items?.map(() => {
      const explicitZeros = {};
      sizeKeys.forEach(size => {
        explicitZeros[size] = 0;
      });
      return explicitZeros;
    }) || [];
    
    console.log("Initializing deliveredSizes with explicit zeros:", JSON.stringify(orderData.deliveredSizes, null, 2));
    
    const purchaseOrder = new PurchaseOrder(orderData);
    await purchaseOrder.save();
    
    // DO NOT create dispatch entries on PO creation - only when delivered qty is entered
    console.log("✓ Purchase order created successfully - no dispatch entries created");
    
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
    console.log("\n" + "=".repeat(60));
    console.log("=== UPDATE PURCHASE ORDER START ===");
    console.log("=".repeat(60));
    console.log("PO ID:", id);
    console.log("Update data received from frontend:", JSON.stringify(updateData, null, 2));

    const hasDeliveredSizesField = Object.prototype.hasOwnProperty.call(updateData || {}, "deliveredSizes");
    console.log("\nHas deliveredSizes field in update:", hasDeliveredSizesField);

    if (hasDeliveredSizesField) {
      const beforeNormalize = JSON.stringify(updateData.deliveredSizes);
      updateData.deliveredSizes = normalizeDeliveredSizes(updateData.deliveredSizes);
      const afterNormalize = JSON.stringify(updateData.deliveredSizes);
      console.log("DeliveredSizes before normalize:", beforeNormalize);
      console.log("DeliveredSizes after normalize:", afterNormalize);
    }

    // Check if there are any actual delivered quantities > 0
    const hasActualDeliveredQty = hasDeliveredSizesField && hasDeliveredQuantities(updateData.deliveredSizes);
    console.log("\nHas actual delivered qty > 0:", hasActualDeliveredQty);

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

    console.log("\n✓ PO updated successfully in database");

    // Only create dispatch entries if there are actual delivered quantities > 0
    // CRITICAL: We pass updateData.deliveredSizes (from frontend), NOT purchaseOrder.deliveredSizes (from DB)
    if (hasActualDeliveredQty) {
      console.log("\n📢 Creating dispatch entries using delivered quantities from frontend");
      console.log("CRITICAL: Using updateData.deliveredSizes, NOT purchaseOrder.items (ordered qty)");
      await createDispatchEntriesFromPO(purchaseOrder, updateData.deliveredSizes);
    } else {
      console.log("\nSkipping dispatch entry creation - no delivered qty > 0");
    }

    console.log("=== UPDATE PURCHASE ORDER END ===");
    console.log("=".repeat(60) + "\n");
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
 * ONLY uses deliveredOverride parameter - NEVER uses purchaseOrder.items quantities
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

    console.log("\n========================================");
    console.log(`=== CREATE DISPATCH ENTRIES START for PO ${purchaseOrder._id} ===`);
    console.log("========================================");
    
    console.log("\n📊 DELIVERED OVERRIDE DATA RECEIVED:");
    console.log(JSON.stringify(deliveredOverride, null, 2));
    
    console.log("\n📦 PURCHASE ORDER ITEMS (for reference only - should NOT be used):");
    purchaseOrder.items.forEach((item, idx) => {
      const sizeQtys = {};
      sizeKeys.forEach(size => {
        sizeQtys[size] = item[size];
      });
      console.log(`  Item ${idx}: ${item.designNumber}-${item.color} -> Ordered: ${JSON.stringify(sizeQtys)}`);
    });

    if (!Array.isArray(deliveredOverride)) {
      console.log("\n❌ ERROR: deliveredOverride is not an array!");
      console.log(`Type: ${typeof deliveredOverride}`);
      console.log("=== CREATE DISPATCH ENTRIES END (no entries created) ===\n");
      return;
    }

    if (deliveredOverride.length === 0) {
      console.log("\n⚠️  deliveredOverride is empty array");
      console.log("=== CREATE DISPATCH ENTRIES END (no entries created) ===\n");
      return;
    }

    if (deliveredOverride.length !== purchaseOrder.items.length) {
      console.log(`\n⚠️  WARNING: deliveredOverride length (${deliveredOverride.length}) !== items length (${purchaseOrder.items.length})`);
    }

    console.log("\n📝 BUILDING DISPATCH ENTRIES:\n");
    
    // IMPORTANT: Convert delivered sizes from deliveredOverride parameter ONLY
    // Never use purchaseOrder.items[index][size] which contains ORDERED quantities
    for (const [index, item] of purchaseOrder.items.entries()) {
      const delivered = deliveredOverride[index];
      
      // Safety check: if no delivered object for this item, skip it
      if (!delivered || typeof delivered !== 'object') {
        console.log(`Item ${index} (${item.designNumber}-${item.color}): ❌ No delivered data provided, SKIPPING`);
        console.log(`  Delivered value type: ${typeof delivered}, value: ${delivered}`);
        continue;
      }

      console.log(`Item ${index}: ${item.designNumber}-${item.color}`);
      
      // Show comparison
      const orderedQtys = {};
      const deliveredQtys = {};
      let deliveredMatchesOrdered = true;
      
      sizeKeys.forEach(size => {
        orderedQtys[size] = item[size] || 0;
        deliveredQtys[size] = delivered[size];
        
        // Check if delivered exactly matches ordered (suspicious!)
        if (deliveredQtys[size] !== orderedQtys[size]) {
          deliveredMatchesOrdered = false;
        }
      });
      
      console.log(`  📋 Ordered:   ${JSON.stringify(orderedQtys)}`);
      console.log(`  📥 Delivered: ${JSON.stringify(deliveredQtys)}`);
      
      // ALERT if delivered exactly matches ordered - this could indicate wrong data
      if (deliveredMatchesOrdered && Object.values(deliveredQtys).some(v => v > 0)) {
        console.log(`  ⚠️ ⚠️ ⚠️ SUSPICIOUS: All delivered quantities EXACTLY match ordered quantities!`);
        console.log(`     This may indicate the frontend is sending ordered quantities instead of delivered!`);
      }
      
      let itemEntriesCount = 0;
      
      for (const size of sizeKeys) {
        const deliveredQty = parseDeliveredQty(delivered[size]);
        const orderedQty = item[size] || 0;
        
        // CRITICAL: Do NOT use orderedQty for dispatch entry qty
        // ONLY use deliveredQty from the delivered object
        
        if (deliveredQty > 0) {
          // Validation: delivered should not exceed ordered
          if (deliveredQty > orderedQty) {
            console.log(`    ⚠️  Size ${size.toUpperCase()}: Delivered (${deliveredQty}) > Ordered (${orderedQty})`);
          }
          
          console.log(`    ✓ Dispatch: ${size.toUpperCase()} x${deliveredQty} (ordered: ${orderedQty})`);
          
          dispatchEntries.push({
            domain: "warehouse",
            warehouseType: "domestic",
            formType: "dispatch",
            dno: item.designNumber,
            type: "",
            color: item.color,
            size: sizeMapping[size],
            qty: deliveredQty,  // MUST be from delivered, NOT from item[size]
            date: purchaseOrder.date,
            receiver: poReference,  // Store PO reference for tracking
          });
          
          itemEntriesCount++;
        } else if (orderedQty > 0) {
          console.log(`    - Size ${size.toUpperCase()}: ordered=${orderedQty}, delivered=0 (no entry)`);
        }
      }
      
      if (itemEntriesCount === 0) {
        console.log(`  Result: No dispatch entries created (all delivered qtys are 0)`);
      }
    }

    console.log("\n" + "=".repeat(50));
    
    // Bulk insert all dispatch entries
    if (dispatchEntries.length > 0) {
      console.log(`✓ CREATING ${dispatchEntries.length} dispatch entries:`);
      dispatchEntries.forEach((entry, idx) => {
        console.log(`  ${idx + 1}. ${entry.dno}-${entry.color} Size ${entry.size} x${entry.qty}`);
      });
      
      await DispatchModel.insertMany(dispatchEntries);
      console.log(`\n✅ Successfully created ${dispatchEntries.length} dispatch entries for PO ${purchaseOrder._id}`);
    } else {
      console.log(`✅ No dispatch entries needed (all delivered quantities are 0 or empty)`);
    }
    
    console.log("=== CREATE DISPATCH ENTRIES END ===");
    console.log("========================================\n");
  } catch (error) {
    console.error("❌ Error creating dispatch entries from PO:", error);
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
    
    console.log(`\n🗑️  Deleting dispatch entries for PO ${purchaseOrderId}...`);
    console.log(`   Looking for entries with receiver="${poReference}"`);
    
    // Delete entries by receiver field (entries created by our code)
    const result = await DispatchModel.deleteMany({ receiver: poReference });
    console.log(`✓ Deleted ${result.deletedCount} dispatch entries for PO ${purchaseOrderId}\n`);
    
    return result.deletedCount;
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
