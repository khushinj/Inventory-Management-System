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
  const { dno, color, items, totalQuantity, date } = stockReturned;
  console.log("[Stock Return] ===== Starting inventory adjustment =====");
  console.log("[Stock Return] DNO:", dno, "Color:", color, "Total Qty:", totalQuantity);
  console.log("[Stock Return] Items:", JSON.stringify(items));

  const errors = [];
  let successCount = 0;

  try {
    // If items array exists, process by size
    if (items && items.length > 0) {
      console.log(`[Stock Return] Processing ${items.length} items...`);
      
      for (const item of items) {
        if (item.qty <= 0) {
          console.log(`[Stock Return] Skipping item with qty ${item.qty} for size ${item.size}`);
          continue;
        }

        try {
          console.log(`[Stock Return] Processing size ${item.size} with qty ${item.qty}...`);
          
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
          console.log(`[Stock Return] ✅ Created shop record: ${shopRecord._id} (qty: ${shopRecord.qty})`);

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
          console.log(`[Stock Return] ✅ Created domestic record: ${domesticRecord._id} (qty: ${domesticRecord.qty})`);
          successCount++;
        } catch (itemError) {
          const errorMsg = `Failed to process item size ${item.size}: ${itemError.message}`;
          console.error(`[Stock Return] ❌ ${errorMsg}`);
          console.error("[Stock Return] Stack:", itemError.stack);
          errors.push(errorMsg);
          // Re-throw to stop processing if a transaction fails
          throw new Error(errorMsg);
        }
      }
    } else if (totalQuantity && totalQuantity > 0) {
      // If no items array, use totalQuantity (old format support)
      console.log("[Stock Return] Processing using totalQuantity (no items array)...");
      
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
      console.log(`[Stock Return] ✅ Created shop record (totalQty): ${shopRecord._id}`);

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
      console.log(`[Stock Return] ✅ Created domestic record (totalQty): ${domesticRecord._id}`);
      successCount++;
    } else {
      throw new Error("No items or totalQuantity provided");
    }
    
    console.log(`[Stock Return] ===== Inventory adjustment completed successfully =====`);
    console.log(`[Stock Return] Successfully processed ${successCount} item(s)`);
    console.log(`[Stock Return] Data added to domestic inventory for DNO: ${dno}, Color: ${color}`);
    
  } catch (error) {
    console.error("[Stock Return] ❌ ===== CRITICAL ERROR adjusting inventory =====");
    console.error("[Stock Return] Error:", error.message);
    console.error("[Stock Return] Stack:", error.stack);
    // Re-throw the error so it bubbles up to the controller
    throw new Error(`Failed to adjust inventory for stock return: ${error.message}`);
  }
};

// Helper function to reverse inventory adjustments
const reverseInventoryAdjustments = async (stockReturned) => {
  const { dno, color, items, totalQuantity, _id } = stockReturned;
  console.log("[Stock Return] ===== Starting inventory reversal =====");
  console.log("[Stock Return] DNO:", dno, "Color:", color);

  try {
    if (items && items.length > 0) {
      console.log(`[Stock Return] Reversing ${items.length} items...`);
      
      for (const item of items) {
        console.log(`[Stock Return] Reversing size ${item.size} with qty ${item.qty}...`);
        
        // Remove from shop inventory (undo the negative entry)
        const ShopModel = getTransactionModel("shop", "", "return");
        const shopDeleted = await ShopModel.deleteMany({
          domain: "shop",
          formType: "return",
          dno,
          color,
          size: item.size,
          qty: -item.qty,
        });
        console.log(`[Stock Return] Deleted ${shopDeleted.deletedCount} shop record(s) for size ${item.size}`);

        // Remove from domestic inventory
        const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
        const domesticDeleted = await DomesticModel.deleteMany({
          domain: "warehouse",
          warehouseType: "domestic",
          formType: "return",
          dno,
          color,
          size: item.size,
          qty: item.qty,
        });
        console.log(`[Stock Return] Deleted ${domesticDeleted.deletedCount} domestic record(s) for size ${item.size}`);
      }
    } else {
      console.log("[Stock Return] Reversing using totalQuantity...");
      
      // Remove from shop inventory
      const ShopModel = getTransactionModel("shop", "", "return");
      const shopDeleted = await ShopModel.deleteMany({
        domain: "shop",
        formType: "return",
        dno,
        color,
        qty: -totalQuantity,
      });
      console.log(`[Stock Return] Deleted ${shopDeleted.deletedCount} shop record(s)`);

      // Remove from domestic inventory
      const DomesticModel = getTransactionModel("warehouse", "domestic", "return");
      const domesticDeleted = await DomesticModel.deleteMany({
        domain: "warehouse",
        warehouseType: "domestic",
        formType: "return",
        dno,
        color,
        qty: totalQuantity,
      });
      console.log(`[Stock Return] Deleted ${domesticDeleted.deletedCount} domestic record(s)`);
    }

    console.log("[Stock Return] ===== Reversal completed successfully =====");
  } catch (error) {
    console.error("[Stock Return] ❌ ===== ERROR reversing inventory =====");
    console.error("[Stock Return] Error:", error.message, error.stack);
    throw new Error(`Failed to reverse inventory adjustments: ${error.message}`);
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
    // Get the old stock return data
    const oldStockReturned = await StockReturned.findById(id);
    if (!oldStockReturned) {
      throw new Error("Stock returned not found");
    }

    // Reverse the old inventory adjustments
    await reverseInventoryAdjustments(oldStockReturned);

    // Update the stock return record
    const stockReturned = await StockReturned.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    // Apply new inventory adjustments
    await adjustInventoryForStockReturned(stockReturned);

    return stockReturned;
  } catch (error) {
    throw new Error(`Error updating stock returned: ${error.message}`);
  }
};

export const deleteStockReturned = async (id) => {
  try {
    const stockReturned = await StockReturned.findById(id);

    if (!stockReturned) {
      throw new Error("Stock returned not found");
    }

    // Reverse the inventory adjustments before deleting
    await reverseInventoryAdjustments(stockReturned);

    // Delete the stock return record
    await StockReturned.findByIdAndDelete(id);

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
