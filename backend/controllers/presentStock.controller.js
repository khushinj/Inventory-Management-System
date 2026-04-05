import PresentStock from "../models/PresentStock.js";
import ProductionTracking from "../models/ProductionTracking.js";

/**
 * Get all present stock entries
 */
export const getAllPresentStockEntries = async (req, res) => {
  try {
    const transferredEntries = await PresentStock.find().sort({ updatedAt: -1 });

    if (transferredEntries.length === 0) {
      return res.json([]);
    }

    const productionIds = transferredEntries.map((entry) => entry.productionTrackingId);
    const productionEntries = await ProductionTracking.find({ _id: { $in: productionIds } });
    const productionById = new Map(productionEntries.map((entry) => [String(entry._id), entry]));

    const entries = transferredEntries
      .map((transferEntry) => {
        const productionEntry = productionById.get(String(transferEntry.productionTrackingId));
        if (!productionEntry) {
          return null;
        }

        return {
          _id: productionEntry._id,
          duo: productionEntry.designNumber || "",
          color: productionEntry.color,
          size: productionEntry.size,
          stockQty: productionEntry.finishing || 0,
          status: transferEntry.status,
        };
      })
      .filter(Boolean);

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get a single present stock entry by ID
 */
export const getPresentStockEntryById = async (req, res) => {
  try {
    const transferEntry = await PresentStock.findOne({ productionTrackingId: req.params.id });
    if (!transferEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const productionEntry = await ProductionTracking.findById(req.params.id);
    if (!productionEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const entry = {
      _id: productionEntry._id,
      duo: productionEntry.designNumber || "",
      color: productionEntry.color,
      size: productionEntry.size,
      stockQty: productionEntry.finishing || 0,
      status: transferEntry.status,
    };

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a new present stock entry
 */
export const createPresentStockEntry = async (req, res) => {
  return res.status(405).json({
    error: "Present stock entries are derived from production tracking. New entries are not allowed.",
  });
};

/**
 * Transfer production entry to present stock
 */
export const transferProductionToPresentStock = async (req, res) => {
  try {
    const productionEntry = await ProductionTracking.findById(req.params.id);
    if (!productionEntry) {
      return res.status(404).json({ error: "Production entry not found" });
    }

    if ((productionEntry.finishing || 0) <= 0) {
      return res.status(400).json({ error: "Only entries with finishing quantity greater than 0 can be transferred" });
    }

    const transferEntry = await PresentStock.findOneAndUpdate(
      { productionTrackingId: productionEntry._id },
      {
        $set: {
          productionTrackingId: productionEntry._id,
          duo: productionEntry.designNumber || "",
          color: productionEntry.color,
          size: productionEntry.size,
        },
        $setOnInsert: {
          status: "Packed",
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({
      message: "Production entry transferred to present stock",
      data: {
        _id: productionEntry._id,
        duo: productionEntry.designNumber || "",
        color: productionEntry.color,
        size: productionEntry.size,
        stockQty: productionEntry.finishing || 0,
        status: transferEntry.status,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update a present stock entry
 */
export const updatePresentStockEntry = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Packed", "Shipped"].includes(status)) {
      return res.status(400).json({ error: "Status must be Packed or Shipped" });
    }

    const transferEntry = await PresentStock.findOne({ productionTrackingId: req.params.id });
    if (!transferEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    const productionEntry = await ProductionTracking.findById(req.params.id);
    if (!productionEntry) {
      return res.status(404).json({ error: "Entry not found" });
    }

    transferEntry.status = status;
    transferEntry.duo = productionEntry.designNumber || "";
    transferEntry.color = productionEntry.color;
    transferEntry.size = productionEntry.size;
    await transferEntry.save();

    const entry = {
      _id: productionEntry._id,
      duo: productionEntry.designNumber || "",
      color: productionEntry.color,
      size: productionEntry.size,
      stockQty: productionEntry.finishing || 0,
      status,
    };

    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Delete a present stock entry
 */
export const deletePresentStockEntry = async (req, res) => {
  return res.status(405).json({
    error: "Present stock entries are derived from production tracking. Deleting entries is not allowed.",
  });
};

/**
 * Get status counts
 */
export const getStatusCounts = async (req, res) => {
  try {
    const result = {
      "Packed": 0,
      "Shipped": 0,
    };

    const counts = await PresentStock.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    counts.forEach((item) => {
      if (Object.prototype.hasOwnProperty.call(result, item._id)) {
        result[item._id] = item.count;
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
