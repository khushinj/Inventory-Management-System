import StockReturned from "../models/StockReturned.js";

export const createStockReturned = async (data) => {
  try {
    const stockReturned = new StockReturned(data);
    await stockReturned.save();
    return stockReturned;
  } catch (error) {
    throw new Error(`Error creating stock returned: ${error.message}`);
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

    return stockReturned;
  } catch (error) {
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
