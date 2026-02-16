import StockReturned from "../models/StockReturned.js";
import { getTransactionModel } from "../models/Transaction.js";

export const createStockReturned = async (data) => {
  try {
    const stockReturned = new StockReturned(data);
    await stockReturned.save();

    // Automatically create inventory adjustments
    await adjustInventoryForStockReturned(stockReturned);

    return stockReturned;
  } catch (error) {
    throw new Error(`Error creating stock returned: ${error.message}`);
  }
};

// Helper function to adjust inventory when stock is returned
const adjustInventoryForStockReturned = async (stockReturned) => {
  try {
    const { dno, color, items, totalQuantity, date } = stockReturned;
    console.log("[Stock Return] Adjusting inventory for:", { dno, color, items, totalQuantity });

    // If items array exists, process by size
    if (items && items.length > 0) {
      for (const item of items) {
        try {
          // Subtract from shop inventory
          const ShopModel = getTransactionModel("shop", "", "return");
          const shopRecord = await ShopModel.create({
            domain: "shop",
            formType: "return",
            dno,
            color,
            size: item.size,
            qty: -item.qty,
            date: date || new Date(),
            channel: "domestic return",
          });
          console.log("[Stock Return] Created shop record:", shopRecord._id);

          // Add to domestic inventory
          const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
          const domesticRecord = await DomesticModel.create({
            domain: "warehouse",
            warehouseType: "domestic",
            formType: "return",
            dno,
            color,
            size: item.size,
            qty: item.qty,
            date: date || new Date(),
            channel: "domestic",
          });
          console.log("[Stock Return] Created domestic record:", domesticRecord._id);
        } catch (itemError) {
          console.error("[Stock Return] Error processing item:", item, itemError.message);
        }
      }
    } else {
      // If no items array, use totalQuantity (old format support)
      try {
        // Subtract from shop inventory
        const ShopModel = getTransactionModel("shop", "", "return");
        const shopRecord = await ShopModel.create({
          domain: "shop",
          formType: "return",
          dno,
          color,
          qty: -totalQuantity,
          date: date || new Date(),
          channel: "domestic return",
        });
        console.log("[Stock Return] Created shop record (totalQty):", shopRecord._id);

        // Add to domestic inventory
        const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
        const domesticRecord = await DomesticModel.create({
          domain: "warehouse",
          warehouseType: "domestic",
          formType: "return",
          dno,
          color,
          qty: totalQuantity,
          date: date || new Date(),
          channel: "domestic",
        });
        console.log("[Stock Return] Created domestic record (totalQty):", domesticRecord._id);
      } catch (totalQtyError) {
        console.error("[Stock Return] Error processing totalQuantity:", totalQtyError.message);
      }
    }
    console.log("[Stock Return] Inventory adjustment completed");
  } catch (error) {
    console.error("[Stock Return] Error adjusting inventory:", error.message, error.stack);
  }
};

export const getAllStockReturned = async (filters = {}) => {
  try {
    const query = {};

    if (filters.dno) {
      query.dno = { $regex: filters.dno, $options: "i" };
    }

    if (filters.color) {
      query.color = { $regex: filters.color, $options: "i" };
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

    const stockReturned = await StockReturned.find(query).sort({ date: -1 });
    return stockReturned;
  } catch (error) {
    throw new Error(`Error fetching stock returned: ${error.message}`);
  }
};

export const getStockReturnedById = async (id) => {
  try {
    const stockReturned = await StockReturned.findById(id);
    if (!stockReturned) {
      throw new Error("Stock returned not found");
    }
    return stockReturned;
  } catch (error) {
    throw new Error(`Error fetching stock returned: ${error.message}`);
  }
};

export const updateStockReturned = async (id, data) => {
  try {
    const stockReturned = await StockReturned.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!stockReturned) {
      throw new Error("Stock returned not found");
    }

    return stockReturned;
  } catch (error) {
    throw new Error(`Error updating stock returned: ${error.message}`);
  }
};

export const deleteStockReturned = async (id) => {
  try {
    const stockReturned = await StockReturned.findByIdAndDelete(id);

    if (!stockReturned) {
      throw new Error("Stock returned not found");
    }

    // Reverse the inventory adjustments when stock returned is deleted
    const { dno, color, items, totalQuantity, date } = stockReturned;
    console.log("[Stock Return] Deleting inventory adjustments for:", { dno, color, items });

    if (items && items.length > 0) {
      for (const item of items) {
        try {
          // Remove from shop inventory (undo the negative entry)
          const ShopModel = getTransactionModel("shop", "", "return");
          await ShopModel.deleteMany({
            domain: "shop",
            formType: "return",
            dno,
            color,
            size: item.size,
            qty: -item.qty,
          });
          console.log("[Stock Return] Deleted shop record for:", item.size);

          // Remove from domestic inventory
          const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
          await DomesticModel.deleteMany({
            domain: "warehouse",
            warehouseType: "domestic",
            formType: "return",
            dno,
            color,
            size: item.size,
            qty: item.qty,
          });
          console.log("[Stock Return] Deleted domestic record for:", item.size);
        } catch (itemError) {
          console.error("[Stock Return] Error deleting item:", item, itemError.message);
        }
      }
    } else {
      try {
        // Remove from shop inventory
        const ShopModel = getTransactionModel("shop", "", "return");
        await ShopModel.deleteMany({
          domain: "shop",
          formType: "return",
          dno,
          color,
          qty: -totalQuantity,
        });

        // Remove from domestic inventory
        const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
        await DomesticModel.deleteMany({
          domain: "warehouse",
          warehouseType: "domestic",
          formType: "return",
          dno,
          color,
          qty: totalQuantity,
        });
      } catch (totalError) {
        console.error("[Stock Return] Error deleting totalQuantity records:", totalError.message);
      }
    }

    console.log("[Stock Return] Deletion completed");
    return stockReturned;
  } catch (error) {
    console.error("[Stock Return] Error deleting stock returned:", error.message, error.stack);
    throw new Error(`Error deleting stock returned: ${error.message}`);
  }
};

export const getStockReturnedStats = async () => {
  try {
    const totalEntries = await StockReturned.countDocuments();
    const totalQuantity = await StockReturned.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalQuantity" },
        },
      },
    ]);

    return {
      totalEntries,
      totalQuantity: totalQuantity[0]?.total || 0,
    };
  } catch (error) {
    throw new Error(`Error fetching stats: ${error.message}`);
  }
};
