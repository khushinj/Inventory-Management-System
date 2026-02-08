import { getTransactionModel } from "../models/Transaction.js";

/**
 * Normalize design number
 */
const normalizeDesignNumber = (dno) => {
  if (!dno) return "N/A";
  return dno.toString().trim().toUpperCase();
};

/**
 * Normalize color
 */
const normalizeColor = (color) => {
  if (!color) return "N/A";
  // Remove extra spaces and convert to uppercase
  return color.toString().trim().replace(/\s+/g, " ").toUpperCase();
};

/**
 * Normalize size
 */
const normalizeSize = (size) => {
  if (!size) return "N/A";
  return size.toString().trim().toUpperCase();
};

/**
 * Calculate inventory for a specific warehouse type (export/online/domestic)
 */
export const calculateWarehouseInventory = async (warehouseType) => {
  try {
    const formTypes = ["dispatch", "production", "purchase", "transfer", "transfer inwards", "transfer outwards", "return", "sales", "sample"];
    
    const inventory = {};

    // Fetch all transactions for this warehouse
    const allTransactions = await Promise.all(
      formTypes.map((formType) => {
        const Model = getTransactionModel("warehouse", warehouseType, formType);
        return Model.find().lean().catch(() => []);
      })
    );

    const transactions = allTransactions.flat();

    // Group by design number with normalization
    transactions.forEach((txn) => {
      const normalizedDno = normalizeDesignNumber(txn.dno);
      const normalizedColor = normalizeColor(txn.color);
      const normalizedSize = normalizeSize(txn.size);
      
      const key = `${normalizedDno}_${normalizedColor}_${normalizedSize}`;
      
      if (!inventory[key]) {
        inventory[key] = {
          dno: normalizedDno,
          color: normalizedColor,
          size: normalizedSize,
          inbound: 0,
          outbound: 0,
          stock: 0,
          lastUpdated: new Date(),
          transactions: [],
        };
      }

      // Categorize as inbound or outbound
      const inboundTypes = ["production", "purchase", "transfer inwards"];
      const outboundTypes = ["dispatch", "sales", "transfer outwards", "return"];

      if (inboundTypes.includes(txn.formType)) {
        inventory[key].inbound += txn.qty || 0;
      } else if (outboundTypes.includes(txn.formType)) {
        inventory[key].outbound += txn.qty || 0;
      }

      inventory[key].transactions.push({
        id: txn._id,
        formType: txn.formType,
        qty: txn.qty,
        date: txn.date,
        type: inboundTypes.includes(txn.formType) ? "inbound" : "outbound",
      });
    });

    // Calculate final stock
    Object.keys(inventory).forEach((key) => {
      inventory[key].stock = inventory[key].inbound - inventory[key].outbound;
    });

    return inventory;
  } catch (error) {
    console.error(`Error calculating ${warehouseType} inventory:`, error);
    throw error;
  }
};

/**
 * Get inventory summary for a specific warehouse type
 */
export const getWarehouseInventorySummary = async (warehouseType) => {
  try {
    const inventory = await calculateWarehouseInventory(warehouseType);
    const summary = {
      warehouseType,
      totalSKUs: Object.keys(inventory).length,
      totalInbound: 0,
      totalOutbound: 0,
      totalStock: 0,
      items: Object.values(inventory),
      lastUpdated: new Date(),
    };

    Object.values(inventory).forEach((item) => {
      summary.totalInbound += item.inbound;
      summary.totalOutbound += item.outbound;
      summary.totalStock += item.stock;
    });

    return summary;
  } catch (error) {
    console.error(`Error getting ${warehouseType} inventory summary:`, error);
    throw error;
  }
};

/**
 * Get inventory for a specific design across all warehouses (comparison)
 */
export const getDesignInventoryComparison = async (dno) => {
  try {
    const warehouses = ["domestic", "export", "online"];
    const comparison = {
      dno,
      warehouses: {},
    };

    for (const warehouse of warehouses) {
      const inventory = await calculateWarehouseInventory(warehouse);
      const designItems = Object.values(inventory).filter((item) => item.dno === dno);
      
      comparison.warehouses[warehouse] = {
        totalStock: designItems.reduce((sum, item) => sum + item.stock, 0),
        items: designItems,
      };
    }

    return comparison;
  } catch (error) {
    console.error(`Error getting design inventory comparison for ${dno}:`, error);
    throw error;
  }
};

/**
 * Get low stock items for a specific warehouse (alert)
 */
export const getLowStockItems = async (warehouseType, threshold = 10) => {
  try {
    const inventory = await calculateWarehouseInventory(warehouseType);
    const lowStockItems = Object.values(inventory).filter((item) => item.stock <= threshold && item.stock > 0);
    
    return {
      warehouseType,
      threshold,
      itemsCount: lowStockItems.length,
      items: lowStockItems.sort((a, b) => a.stock - b.stock),
    };
  } catch (error) {
    console.error(`Error getting low stock items for ${warehouseType}:`, error);
    throw error;
  }
};

/**
 * Get out of stock items for a specific warehouse
 */
export const getOutOfStockItems = async (warehouseType) => {
  try {
    const inventory = await calculateWarehouseInventory(warehouseType);
    const outOfStockItems = Object.values(inventory).filter((item) => item.stock <= 0);
    
    return {
      warehouseType,
      itemsCount: outOfStockItems.length,
      items: outOfStockItems,
    };
  } catch (error) {
    console.error(`Error getting out of stock items for ${warehouseType}:`, error);
    throw error;
  }
};

/**
 * Get inventory trends for a specific warehouse over time
 */
export const getInventoryTrends = async (warehouseType, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formTypes = ["dispatch", "production", "purchase", "transfer", "transfer inwards", "transfer outwards", "return", "sales"];
    
    const transactions = [];
    for (const formType of formTypes) {
      const Model = getTransactionModel("warehouse", warehouseType, formType);
      const data = await Model.find({ date: { $gte: startDate } }).lean().catch(() => []);
      transactions.push(...data);
    }

    // Group by date
    const trends = {};
    transactions.forEach((txn) => {
      const dateKey = new Date(txn.date).toISOString().split("T")[0];
      if (!trends[dateKey]) {
        trends[dateKey] = { inbound: 0, outbound: 0 };
      }

      const inboundTypes = ["production", "purchase", "transfer inwards"];
      if (inboundTypes.includes(txn.formType)) {
        trends[dateKey].inbound += txn.qty || 0;
      } else {
        trends[dateKey].outbound += txn.qty || 0;
      }
    });

    return {
      warehouseType,
      days,
      trends: Object.keys(trends)
        .sort()
        .map((date) => ({
          date,
          ...trends[date],
          netChange: trends[date].inbound - trends[date].outbound,
        })),
    };
  } catch (error) {
    console.error(`Error getting inventory trends for ${warehouseType}:`, error);
    throw error;
  }
};

/**
 * Compare inventory across all warehouses
 */
export const compareAllWarehouses = async () => {
  try {
    const warehouses = ["domestic", "export", "online"];
    const comparison = {};

    for (const warehouse of warehouses) {
      const summary = await getWarehouseInventorySummary(warehouse);
      comparison[warehouse] = summary;
    }

    return {
      timestamp: new Date(),
      warehouses: comparison,
      grandTotal: {
        totalSKUs: Object.values(comparison).reduce((sum, w) => sum + w.totalSKUs, 0),
        totalInbound: Object.values(comparison).reduce((sum, w) => sum + w.totalInbound, 0),
        totalOutbound: Object.values(comparison).reduce((sum, w) => sum + w.totalOutbound, 0),
        totalStock: Object.values(comparison).reduce((sum, w) => sum + w.totalStock, 0),
      },
    };
  } catch (error) {
    console.error("Error comparing all warehouses:", error);
    throw error;
  }
};
